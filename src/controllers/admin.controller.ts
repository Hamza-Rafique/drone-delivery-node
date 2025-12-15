import { Request, Response } from 'express';
import { Order, Drone } from '../models';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, DroneStatus, OrderStatus } from '../types';

export const getOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 50,
      status,
      startDate,
      endDate 
    } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email userType')
        .populate('drone', 'serialNumber model status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      orders
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get orders error:', error);
    throw new AppError('Failed to get orders', 500);
  }
};

export const updateOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { origin, destination } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Only allow updates if order is pending or reserved
    if (![OrderStatus.PENDING, OrderStatus.RESERVED].includes(order.status)) {
      throw new AppError('Cannot modify order in current state', 400);
    }

    // Update order
    if (origin) order.origin = { ...order.origin, ...origin };
    if (destination) order.destination = { ...order.destination, ...destination };

    await order.save();
    logger.info(`Order ${orderId} updated by admin`);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Update order error:', error);
    throw new AppError('Failed to update order', 500);
  }
};

export const getDrones = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, isActive } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const drones = await Drone.find(query)
      .populate('currentOrder', 'orderId status destination')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: drones.length,
      drones
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get drones error:', error);
    throw new AppError('Failed to get drones', 500);
  }
};

export const updateDroneStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { droneId } = req.params;
    const { status } = req.body;

    const drone = await Drone.findById(droneId);
    
    if (!drone) {
      throw new AppError('Drone not found', 404);
    }

    // Validate status
    if (!Object.values(DroneStatus).includes(status)) {
      throw new AppError('Invalid drone status', 400);
    }

    // Update drone status
    drone.status = status;
    await drone.save();

    // If marking as broken and drone has current order, create handoff job
    if (status === DroneStatus.BROKEN && drone.currentOrder) {
      const { Job } = await import('../models');
      const order = await Order.findById(drone.currentOrder);
      
      if (order && order.status === OrderStatus.IN_TRANSIT) {
        const handoffJob = new Job({
          order: order._id,
          pickupLocation: drone.location,
          dropoffLocation: order.destination,
          priority: 10,
          status: 'available'
        });

        await handoffJob.save();

        // Update order as handoff job
        order.isHandoffJob = true;
        order.originalDrone = droneId as any;
        order.handoffCount += 1;
        await order.save();

        logger.info(`Admin created handoff job for order ${order._id} from broken drone ${droneId}`);
      }
    }

    logger.info(`Drone ${droneId} status updated to ${status} by admin`);

    res.status(200).json({
      success: true,
      message: `Drone status updated to ${status}`,
      drone: {
        id: drone._id,
        serialNumber: drone.serialNumber,
        status: drone.status,
        location: drone.location,
        isActive: drone.isActive
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Update drone status error:', error);
    throw new AppError('Failed to update drone status', 500);
  }
};