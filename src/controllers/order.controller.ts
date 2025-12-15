import { Request, Response } from 'express';
import Order from '../models/Order';
import Drone from '../models/Drone';

export const droneController = {
  /**
   * Reserve a job (first available order)
   */
  async reserveJob(req: Request, res: Response) {
    const droneId = req.user!.userId;

    const drone = await Drone.findOne({ userId: droneId });
    if (!drone || drone.status !== 'IDLE') {
      return res.status(400).json({ message: 'Drone not available' });
    }

    const order = await Order.findOne({
      status: 'SUBMITTED',
      assignedDrone: null,
    });

    if (!order) {
      return res.status(404).json({ message: 'No jobs available' });
    }

    order.status = 'RESERVED';
    order.assignedDrone = drone._id;

    drone.status = 'BUSY';
    drone.currentOrder = order._id;

    await Promise.all([order.save(), drone.save()]);

    res.json({ message: 'Job reserved', data: order });
  },

  /**
   * Deliver order
   */
  async deliverOrder(req: Request, res: Response) {
    const droneId = req.user!.userId;
    const order = await Order.findById(req.params.id);

    if (!order || order.status !== 'PICKED') {
      return res.status(400).json({ message: 'Invalid order state' });
    }

    order.status = 'DELIVERED';
    order.assignedDrone = null;
    await order.save();

    await Drone.updateOne(
      { userId: droneId },
      { status: 'IDLE', currentOrder: null }
    );

    res.json({ message: 'Order delivered' });
  },

  /**
   * Fail order
   */
  async failOrder(req: Request, res: Response) {
    const droneId = req.user!.userId;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'FAILED';
    order.assignedDrone = null;
    await order.save();

    await Drone.updateOne(
      { userId: droneId },
      { status: 'IDLE', currentOrder: null }
    );

    res.json({ message: 'Order marked as failed' });
  },

  /**
   * Mark drone as broken
   */
  async markBroken(req: Request, res: Response) {
    const drone = await Drone.findOne({ userId: req.user!.userId });

    if (!drone) {
      return res.status(404).json({ message: 'Drone not found' });
    }

    if (drone.currentOrder) {
      await Order.findByIdAndUpdate(drone.currentOrder, {
        status: 'SUBMITTED',
        assignedDrone: null,
      });
    }

    drone.status = 'BROKEN';
    drone.currentOrder = null;
    await drone.save();

    res.json({ message: 'Drone marked as broken' });
  },

  /**
   * Update drone location
   */
  async updateLocation(req: Request, res: Response) {
    const { lat, lng } = req.body;

    await Drone.updateOne(
      { userId: req.user!.userId },
      {
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      }
    );

    res.json({ message: 'Location updated' });
  },

  /**
   * Heartbeat
   */
  async heartbeat(req: Request, res: Response) {
    const drone = await Drone.findOne({ userId: req.user!.userId });

    res.json({
      status: drone?.status,
      currentOrder: drone?.currentOrder,
    });
  },

  /**
   * Get current order
   */
  async getCurrentOrder(req: Request, res: Response) {
    const drone = await Drone.findOne({ userId: req.user!.userId }).populate(
      'currentOrder'
    );

    if (!drone?.currentOrder) {
      return res.status(404).json({ message: 'No active order' });
    }

    res.json({ data: drone.currentOrder });
  },
};
