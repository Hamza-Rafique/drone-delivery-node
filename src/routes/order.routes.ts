import { Router } from 'express';

import { validateRequest } from '../middleware/validateRequest';
import { body, param } from 'express-validator';
import { orderController } from '../controllers/order.controller';

const router = Router();

router.post(
  '/',
  [
    body('origin.lat').isFloat({ min: -90, max: 90 }),
    body('origin.lng').isFloat({ min: -180, max: 180 }),
    body('destination.lat').isFloat({ min: -90, max: 90 }),
    body('destination.lng').isFloat({ min: -180, max: 180 }),
  ],
  validateRequest,
  orderController.createOrder
);

router.get('/:id', [param('id').isMongoId()], validateRequest, orderController.getOrderById);

router.delete('/:id', [param('id').isMongoId()], validateRequest, orderController.withdrawOrder);

router.get('/users/me/orders', orderController.getUserOrders);

export default router;
