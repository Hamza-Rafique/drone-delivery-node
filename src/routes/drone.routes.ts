import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { droneController } from '../controllers/';

const router = Router();

// All drone routes require authentication and drone user type
router.use(authenticate, authorize('DRONE'));

// Reserve a job
router.post(
  '/reserve-job',
  droneController.reserveJob
);

// Pickup order
router.post(
  '/pickup-order/:orderId',
  [
    param('orderId').isString().notEmpty(),
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
  ],
  validateRequest,
  droneController.pickupOrder
);

// Deliver order
router.post(
  '/deliver-order/:orderId',
  [
    param('orderId').isString().notEmpty(),
    body('status').isIn(['DELIVERED', 'FAILED']),
    body('notes').optional().isString(),
  ],
  validateRequest,
  droneController.deliverOrder
);

// Report broken
router.post(
  '/report-broken',
  [
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('reason').optional().isString(),
  ],
  validateRequest,
  droneController.reportBroken
);

// Update heartbeat
router.post(
  '/heartbeat',
  [
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('batteryLevel').isInt({ min: 0, max: 100 }),
  ],
  validateRequest,
  droneController.updateHeartbeat
);

// Get current order
router.get(
  '/current-order',
  droneController.getCurrentOrder
);

export default router;