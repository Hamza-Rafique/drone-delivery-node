import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', authController.login.bind(authController));

// Protected routes
router.get('/verify', authenticate, authController.verify.bind(authController));

export default router;