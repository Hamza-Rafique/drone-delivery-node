import { Router } from 'express';
import { authenticateToken } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { adminController } from '../controllers/admin.controller';

const router = Router();

router.use(authenticateToken, requireRole(['ADMIN']));

router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id', adminController.updateOrder);
router.get('/drones', adminController.getDrones);
router.put('/drones/:id/status', adminController.updateDroneStatus);

export default router;
