import { Request, Response } from 'express';
import { Order, User } from '../models';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, OrderStatus } from '../types';

export const submitOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { origin, destination, weight, priority } = req.body;

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order
    const order = new Order({
      orderId,
      user: userId,
      origin,
      destination,
      weight,
      priority,
      status: OrderStatus.PENDING
    });

    await order.save();
    logger.info(`Order ${orderId} submitted by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Order submitted successfully',
      order: {
        id: order._id,
        orderId: order.orderId,
        status: order.status,
        origin: order.origin,
        destination: order.destination,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Submit order error:', error);
    throw new AppError('Failed to submit order', 500);
  }
};

export const getOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userType = req.user?.userType;
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId })
      .populate('user', 'name email')
      .populate('drone', 'serialNumber model status location')
      .populate('originalDrone', 'serialNumber model');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check authorization
    const isOwner = order.user._id.toString() === userId;
    const isAdmin = userType === 'admin';
    const isAssignedDrone = order.drone && order.drone._id.toString() === userId;

    if (!isOwner && !isAdmin && !isAssignedDrone) {
      throw new AppError('Not authorized to view this order', 403);
    }

    // Calculate ETA if in transit
    let eta = null;
    if (order.status === OrderStatus.IN_TRANSIT && order.drone) {
      // Simple ETA calculation for demonstration
      const droneLocation = (order.drone as any).location;
      if (droneLocation) {
        const distance = Math.sqrt(
          Math.pow(droneLocation.latitude - order.destination.latitude, 2) +
          Math.pow(droneLocation.longitude - order.destination.longitude, 2)
        );
        // Assuming average speed of 0.01 degrees per minute
        eta = new Date(Date.now() + (distance / 0.01) * 60 * 1000);
      }
    }

    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        eta
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get order error:', error);
    throw new AppError('Failed to get order', 500);
  }
};

export const withdrawOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { orderId } = req.params;

    const order = await Order.findOne({ 
      orderId,
      user: userId,
      status: OrderStatus.PENDING
    });

    if (!order) {
      throw new AppError('Order not found or cannot be withdrawn', 404);
    }

    // Withdraw order
    order.status = OrderStatus.WITHDRAWN;
    await order.save();

    logger.info(`Order ${orderId} withdrawn by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Order withdrawn successfully'
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Withdraw order error:', error);
    throw new AppError('Failed to withdraw order', 500);
  }
};

export const getUserOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('drone', 'serialNumber model status location')
      .lean();

    // Calculate ETA for each order in transit
    const ordersWithETA = orders.map(order => {
      let eta = null;
      if (order.status === OrderStatus.IN_TRANSIT && order.drone) {
        const droneLocation = (order.drone as any).location;
        if (droneLocation) {
          const distance = Math.sqrt(
            Math.pow(droneLocation.latitude - order.destination.latitude, 2) +
            Math.pow(droneLocation.longitude - order.destination.longitude, 2)
          );
          eta = new Date(Date.now() + (distance / 0.01) * 60 * 1000);
        }
      }

      return {
        ...order,
        eta
      };
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders: ordersWithETA
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get user orders error:', error);
    throw new AppError('Failed to get user orders', 500);
  }
};