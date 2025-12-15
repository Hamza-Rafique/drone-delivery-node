import { Request, Response } from 'express';
import { Order, IOrder } from '../models/Order';


/**
 * Order Controller handles user order endpoints:
 * - Create order
 * - Get order by ID
 * - Withdraw order
 * - Get user orders
 */
export const orderController = {
  /**
   * Create a new order
   */
  async createOrder(req: Request, res: Response) {
    try {
      const userId = req.user!.id; // Injected by auth middleware
      const { origin, destination } = req.body;

      const order = new Order({
        user: userId,
        origin,
        destination,
        status: 'SUBMITTED',
        timeline: [{ status: 'SUBMITTED', timestamp: new Date() }],
      });

      await order.save();

      res.status(201).json({
        message: 'Order created successfully',
        data: order,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * Get order by ID
   */
  async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id).populate('user');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json({ data: order });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * Withdraw an order (if not picked)
   */
  async withdrawOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const order = await Order.findOne({ _id: id, user: userId });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.status !== 'SUBMITTED') {
        return res.status(400).json({ message: 'Cannot withdraw, already picked' });
      }

      await Order.deleteOne({ _id: id });

      res.json({ message: 'Order withdrawn successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * Get all orders of the logged-in user
   */
  async getUserOrders(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

      res.json({ data: orders });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};
