import { Router } from 'express';
import { getUserProfile } from '../controllers/user.controller';
import { requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private (All authenticated users)
 */
router.get('/me', getUserProfile);

export default router;