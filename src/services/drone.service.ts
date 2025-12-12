import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { ApiError } from '../utils/ApiError';
import { calculateDistance, calculateETA } from '../utils/geo';
import { logger } from '../utils/logger';
import { io } from '../app';

export class DroneService {
  async reserveJob(droneId: string): Promise<any> {
    const drone = await prisma.drone.findUnique({
      where: { id: droneId },
      include: { currentOrder: true },
    });

    if (!drone) {
      throw new ApiError(404, 'Drone not found');
    }

    if (drone.status !== 'AVAILABLE') {
      throw new ApiError(400, 'Drone is not available');
    }

    // Find nearest pending order
    const pendingOrder = await this.findNearestPendingOrder(drone);
    
    if (!pendingOrder) {
      throw new ApiError(404, 'No pending orders available');
    }

    // Reserve the order
    const updatedOrder = await prisma.order.update({
      where: { id: pendingOrder.id },
      data: {
        status: 'ASSIGNED',
        droneId: drone.id,
        estimatedDelivery: this.calculateEstimatedDelivery(
          drone.currentLat || pendingOrder.originLat,
          drone.currentLng || pendingOrder.originLng,
          pendingOrder.destLat,
          pendingOrder.destLng
        ),
      },
      include: {
        user: { select: { username: true } },
      },
    });

    // Update drone status
    await prisma.drone.update({
      where: { id: droneId },
      data: {
        status: 'BUSY',
        currentOrderId: pendingOrder.id,
      },
    });

    // Notify user via WebSocket
    io.to(`order:${pendingOrder.id}`).emit('order-assigned', {
      orderId: pendingOrder.id,
      droneId: drone.id,
      droneName: drone.name,
      estimatedDelivery: updatedOrder.estimatedDelivery,
    });

    // Notify admin
    io.to('admin-room').emit('drone-assigned', {
      droneId: drone.id,
      orderId: pendingOrder.id,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Drone ${droneId} reserved order ${pendingOrder.id}`);
    
    return updatedOrder;
  }

  async updateHeartbeat(
    droneId: string,
    data: { lat: number; lng: number; batteryLevel: number }
  ): Promise<any> {
    const drone = await prisma.drone.findUnique({
      where: { id: droneId },
      include: { currentOrder: true },
    });

    if (!drone) {
      throw new ApiError(404, 'Drone not found');
    }

    const updateData: any = {
      lastHeartbeat: new Date(),
      currentLat: data.lat,
      currentLng: data.lng,
      batteryLevel: data.batteryLevel,
    };

    // Update order location if drone has one
    if (drone.currentOrder) {
      await prisma.order.update({
        where: { id: drone.currentOrder.id },
        data: {
          currentLat: data.lat,
          currentLng: data.lng,
          // Update ETA based on current position
          estimatedDelivery: this.calculateEstimatedDelivery(
            data.lat,
            data.lng,
            drone.currentOrder.destLat,
            drone.currentOrder.destLng
          ),
        },
      });

      // Broadcast location update
      io.to(`order:${drone.currentOrder.id}`).emit('location-update', {
        orderId: drone.currentOrder.id,
        lat: data.lat,
        lng: data.lng,
        batteryLevel: data.batteryLevel,
        timestamp: new Date().toISOString(),
      });
    }

    // Check battery level
    if (data.batteryLevel < 20) {
      updateData.status = 'MAINTENANCE';
      logger.warn(`Drone ${droneId} battery low: ${data.batteryLevel}%`);
    }

    const updatedDrone = await prisma.drone.update({
      where: { id: droneId },
      data: updateData,
      include: { currentOrder: true },
    });

    // Store heartbeat in Redis for real-time monitoring
    await redis.setex(
      `drone:heartbeat:${droneId}`,
      60,
      JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        droneId,
      })
    );

    return updatedDrone;
  }

  async reportBroken(droneId: string, location: { lat: number; lng: number }): Promise<any> {
    const drone = await prisma.drone.findUnique({
      where: { id: droneId },
      include: { currentOrder: true },
    });

    if (!drone) {
      throw new ApiError(404, 'Drone not found');
    }

    if (!drone.currentOrder) {
      throw new ApiError(400, 'Drone does not have an active order');
    }

    // Create handoff request
    const handoffRequest = await prisma.handoffRequest.create({
      data: {
        brokenDroneId: droneId,
        orderId: drone.currentOrder.id,
        locationLat: location.lat,
        locationLng: location.lng,
        status: 'PENDING',
      },
      include: {
        order: true,
        brokenDrone: true,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: drone.currentOrder.id },
      data: { status: 'HANDOFF_PENDING' },
    });

    // Update drone status
    await prisma.drone.update({
      where: { id: droneId },
      data: { status: 'BROKEN' },
    });

    // Find available drone for handoff
    await this.assignHandoffToAvailableDrone(handoffRequest.id);

    // Notify admin
    io.to('admin-room').emit('drone-broken', {
      droneId,
      orderId: drone.currentOrder.id,
      handoffRequestId: handoffRequest.id,
      location,
      timestamp: new Date().toISOString(),
    });

    logger.warn(`Drone ${droneId} reported broken with order ${drone.currentOrder.id}`);

    return handoffRequest;
  }

  private async findNearestPendingOrder(drone: any): Promise<any> {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { droneId: null },
          { droneId: drone.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    if (pendingOrders.length === 0) return null;

    // Calculate distances and find nearest
    let nearestOrder = pendingOrders[0];
    let shortestDistance = Infinity;

    for (const order of pendingOrders) {
      const distance = calculateDistance(
        drone.currentLat || order.originLat,
        drone.currentLng || order.originLng,
        order.originLat,
        order.originLng
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestOrder = order;
      }
    }

    return nearestOrder;
  }

  private calculateEstimatedDelivery(
    startLat: number,
    startLng: number,
    destLat: number,
    destLng: number
  ): Date {
    const distance = calculateDistance(startLat, startLng, destLat, destLng);
    const etaMinutes = calculateETA(distance, 15); // 15 km/h average speed
    
    const deliveryTime = new Date();
    deliveryTime.setMinutes(deliveryTime.getMinutes() + etaMinutes);
    
    return deliveryTime;
  }

  private async assignHandoffToAvailableDrone(handoffRequestId: string): Promise<void> {
    const handoffRequest = await prisma.handoffRequest.findUnique({
      where: { id: handoffRequestId },
      include: { order: true, brokenDrone: true },
    });

    if (!handoffRequest || handoffRequest.status !== 'PENDING') return;

    // Find available drone near broken drone
    const availableDrones = await prisma.drone.findMany({
      where: {
        status: 'AVAILABLE',
        batteryLevel: { gt: 30 },
        id: { not: handoffRequest.brokenDroneId },
      },
    });

    if (availableDrones.length === 0) {
      logger.warn(`No available drones for handoff ${handoffRequestId}`);
      return;
    }

    // Find nearest available drone
    let nearestDrone = availableDrones[0];
    let shortestDistance = Infinity;

    for (const drone of availableDrones) {
      if (drone.currentLat && drone.currentLng) {
        const distance = calculateDistance(
          drone.currentLat,
          drone.currentLng,
          handoffRequest.locationLat,
          handoffRequest.locationLng
        );

        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestDrone = drone;
        }
      }
    }

    // Assign handoff
    await prisma.handoffRequest.update({
      where: { id: handoffRequestId },
      data: {
        status: 'ASSIGNED',
        rescueDroneId: nearestDrone.id,
      },
    });

    // Update order
    await prisma.order.update({
      where: { id: handoffRequest.orderId },
      data: {
        droneId: nearestDrone.id,
        status: 'ASSIGNED',
      },
    });

    // Update rescue drone
    await prisma.drone.update({
      where: { id: nearestDrone.id },
      data: {
        status: 'BUSY',
        currentOrderId: handoffRequest.orderId,
      },
    });

    // Notify via WebSocket
    io.to(`drone:${nearestDrone.id}`).emit('handoff-assigned', {
      handoffRequestId,
      orderId: handoffRequest.orderId,
      brokenDroneId: handoffRequest.brokenDroneId,
      location: {
        lat: handoffRequest.locationLat,
        lng: handoffRequest.locationLng,
      },
    });

    logger.info(`Handoff ${handoffRequestId} assigned to drone ${nearestDrone.id}`);
  }
}

export const droneService = new DroneService();