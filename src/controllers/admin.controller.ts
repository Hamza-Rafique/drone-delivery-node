import { Request, Response } from 'express';
import Order from '../models/Order';
import Drone from '../models/Drone';

export const adminController = {
  
  async getAllOrders(req: Request, res: Response) {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ data: orders });
  },

  
  async updateOrder(req: Request, res: Response) {
    const { origin, destination } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        ...(origin && {
          origin: {
            type: 'Point',
            coordinates: [origin.lng, origin.lat],
          },
        }),
        ...(destination && {
          destination: {
            type: 'Point',
            coordinates: [destination.lng, destination.lat],
          },
        }),
      },
      { new: true }
    );

    res.json({ message: 'Order updated', data: order });
  },

  /**
   * List drones
   */
  async getDrones(req: Request, res: Response) {
    const drones = await Drone.find();
    res.json({ data: drones });
  },

  /**
   * Mark drone broken / fixed
   */
  async updateDroneStatus(req: Request, res: Response) {
    const { status } = req.body;

    const drone = await Drone.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({ message: 'Drone status updated', data: drone });
  },
};
