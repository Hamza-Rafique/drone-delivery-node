import { Router } from 'express';
import Order from '../models/Order';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Enduser creates order
router.post('/', roleMiddleware(['enduser']), async (req: AuthRequest, res) => {
  const { origin, destination } = req.body;
  const order = await Order.create({ origin, destination, createdBy: req.user._id });
  res.json(order);
});

// Enduser withdraws order
router.delete('/:id', roleMiddleware(['enduser']), async (req: AuthRequest, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status !== 'pending') return res.status(400).json({ message: 'Cannot withdraw in-progress order' });
  await order.remove();
  res.json({ message: 'Order withdrawn' });
});

// Get order details
router.get('/:id', async (req: AuthRequest, res) => {
  const order = await Order.findById(req.params.id).populate('assignedDrone');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

export default router;
