import { Router } from 'express';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth.middleware';
import Order from '../models/Order';
import Drone from '../models/Drone';

const router = Router();
router.use(authMiddleware, roleMiddleware(['admin']));

// List drones
router.get('/drones', async (_, res) => {
  const drones = await Drone.find();
  res.json(drones);
});

// Mark drone broken/fixed
router.post('/drones/:id/status', async (req: AuthRequest, res) => {
  const { status } = req.body;
  const drone = await Drone.findById(req.params.id);
  if (!drone) return res.status(404).json({ message: 'Drone not found' });
  drone.status = status;
  await drone.save();
  res.json(drone);
});

// Bulk get orders
router.get('/orders', async (_, res) => {
  const orders = await Order.find().populate('assignedDrone');
  res.json(orders);
});

// Change order origin/destination
router.put('/orders/:id', async (req, res) => {
  const { origin, destination } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (origin) order.origin = origin;
  if (destination) order.destination = destination;
  await order.save();
  res.json(order);
});

export default router;
