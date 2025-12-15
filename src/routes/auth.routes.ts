import { Router } from 'express';
import { authenticate, register } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authSchema } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get JWT token
 * @access  Public
 */
router.post('/login', validateRequest(authSchema), authenticate);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (for testing purposes)
 * @access  Public
 */
router.post('/register', validateRequest(authSchema), register);

export default router;