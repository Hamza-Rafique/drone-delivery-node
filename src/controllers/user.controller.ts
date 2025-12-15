import { Request, Response } from 'express';
import { User } from '../models';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const user = await User.findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Get user profile error:', error);
    throw new AppError('Failed to get user profile', 500);
  }
};