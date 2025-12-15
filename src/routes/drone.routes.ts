import { Router } from 'express';
import {
  reserveJob,
  getOrder,
  markDelivered,
  markFailed,
  markBroken,
  updateLocation,
  heartbeat,
  getCurrentOrder
} from '../controllers/drone.controller';
import { requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { locationSchema, droneStatusSchema } from '../middleware/validation.middleware';

const router = Router();

// All drone routes require drone role
router.use(requireRole(['drone']));

/**
 * @route   POST /api/drones/jobs/reserve
 * @desc    Reserve a job
 * @access  Private (Drone only)
 */
router.post('/jobs/reserve', reserveJob);

/**
 * @route   GET /api/drones/orders/current
 * @desc    Get current assigned order details
 * @access  Private (Drone only)
 */
router.get('/orders/current', getCurrentOrder);

/**
 * @route   PUT /api/drones/orders/:orderId/deliver
 * @desc    Mark order as delivered
 * @access  Private (Drone only)
 */
router.put('/orders/:orderId/deliver', markDelivered);

/**
 * @route   PUT /api/drones/orders/:orderId/fail
 * @desc    Mark order as failed
 * @access  Private (Drone only)
 */
router.put('/orders/:orderId/fail', markFailed);

/**
 * @route   PUT /api/drones/status/broken
 * @desc    Mark drone as broken
 * @access  Private (Drone only)
 */
router.put('/status/broken', validateRequest(droneStatusSchema), markBroken);

/**
 * @route   PUT /api/drones/location
 * @desc    Update drone location
 * @access  Private (Drone only)
 */
router.put('/location', validateRequest(locationSchema), updateLocation);

/**
 * @route   GET /api/drones/heartbeat
 * @desc    Get drone status update (heartbeat)
 * @access  Private (Drone only)
 */
router.get('/heartbeat', heartbeat);

export default router;