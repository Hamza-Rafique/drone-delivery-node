import { Router } from 'express';
import {
  submitOrder,
  getOrder,
  withdrawOrder,
  getUserOrders
} from '../controllers/order.controller';
import { requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { orderSchema } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /api/orders
 * @desc    Submit a new order
 * @access  Private (Enduser only)
 */
router.post('/', requireRole(['enduser']), validateRequest(orderSchema), submitOrder);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get order details
 * @access  Private (Owner or Admin)
 */
router.get('/:orderId', getOrder);

/**
 * @route   DELETE /api/orders/:orderId
 * @desc    Withdraw an order (if not picked up)
 * @access  Private (Owner only)
 */
router.delete('/:orderId', requireRole(['enduser']), withdrawOrder);

/**
 * @route   GET /api/orders/user/me
 * @desc    Get all orders for current user
 * @access  Private (Enduser only)
 */
router.get('/user/me', requireRole(['enduser']), getUserOrders);

export default router;