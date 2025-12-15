import { Router } from 'express';
import {Drone} from '../models/Drone';
import{ Order, OrderStatus} from '../models/Order';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware, roleMiddleware(['drone']));

// Drone updates location (heartbeat)
router.post('/heartbeat', async (req: AuthRequest, res) => {
  const { lat, lng } = req.body;
  const drone = await Drone.findById(req.user._id);
  if (!drone) return res.status(404).json({ message: 'Drone not found' });
  drone.location = { lat, lng };
  await drone.save();
  res.json(drone);
});

// Mark drone broken/fixed
router.post('/status', async (req: AuthRequest, res) => {
  const { status } = req.body;
  const drone = await Drone.findById(req.user._id);
  if (!drone) return res.status(404).json({ message: 'Drone not found' });
  drone.status = status;
  if (status === 'broken' && drone.currentOrder) {
    const order = await Order.findById(drone.currentOrder);
    order!.status = 'pending' as OrderStatus;
    order!.assignedDrone = null;
    await order!.save();
    drone.currentOrder = null;
  }
  await drone.save();
  res.json(drone);
});

export default router;
