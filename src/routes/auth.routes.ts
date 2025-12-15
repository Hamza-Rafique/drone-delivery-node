import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.post(
  '/login',
  [
    body('name')
      .isString()
      .trim()
      .notEmpty()
      .escape(),

    body('role')
      .isIn(['ADMIN', 'ENDUSER', 'DRONE']),
  ],
  validateRequest,
  authController.login
);

export default router;
