import { Router } from 'express';
import {
  getOrders,
  updateOrder,
  getDrones,
  updateDroneStatus
} from '../controllers/admin.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require admin role
router.use(requireRole(['admin']));

/**
 * @route   GET /api/admin/orders
 * @desc    Get multiple orders in bulk
 * @access  Private (Admin only)
 */
router.get('/orders', getOrders);

/**
 * @route   PUT /api/admin/orders/:orderId
 * @desc    Change order origin or destination
 * @access  Private (Admin only)
 */
router.put('/orders/:orderId', updateOrder);

/**
 * @route   GET /api/admin/drones
 * @desc    Get list of all drones
 * @access  Private (Admin only)
 */
router.get('/drones', getDrones);

/**
 * @route   PUT /api/admin/drones/:droneId/status
 * @desc    Mark drone as broken or fixed
 * @access  Private (Admin only)
 */
router.put('/drones/:droneId/status', updateDroneStatus);

export default router;