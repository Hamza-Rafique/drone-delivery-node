import { Router } from 'express';
import { Order } from '../models/Order';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);


router.post('/', roleMiddleware(['enduser']), async (req: AuthRequest, res) => {
  const { origin, destination } = req.body;
  const order = await Order.create({ origin, destination, createdBy: req.user._id });
  res.json(order);
});


router.delete('/:id', roleMiddleware(['enduser']), async (req: AuthRequest, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status !== OrderStatus.PENDING) return res.status(400).json({ message: 'Cannot withdraw in-progress order' });
  await Order.deleteOne({ _id: req.params.id });
  res.json({ message: 'Order withdrawn' });
});


router.get('/:id', async (req: AuthRequest, res) => {
  const order = await Order.findById(req.params.id).populate('assignedDrone');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

export default router;
