import { Router } from 'express';

import { authenticateToken } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { droneController } from '../controllers/order.controller';

const router = Router();

router.use(authenticateToken, requireRole(['DRONE']));

router.post('/jobs/reserve', droneController.reserveJob);
router.put('/orders/:id/deliver', droneController.deliverOrder);
router.put('/orders/:id/fail', droneController.failOrder);
router.put('/status/broken', droneController.markBroken);
router.put('/location', droneController.updateLocation);
router.get('/heartbeat', droneController.heartbeat);
router.get('/current-order', droneController.getCurrentOrder);

export default router;
