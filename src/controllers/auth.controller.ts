import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { generateToken } from '../config/jwt';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../types';

export const authenticate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, userType } = req.body;

    // In a real application, you would verify credentials against a database
    // For this assessment, we'll create/authenticate based on the provided data
    
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create a new user for the purpose of this assessment
      const hashedPassword = await bcrypt.hash('defaultPassword123', 10);
      
      user = new User({
        name,
        email,
        password: hashedPassword,
        userType
      });
      
      await user.save();
      logger.info(`New user created: ${email} (${userType})`);
    }

    // Verify user type matches
    if (user.userType !== userType) {
      throw new AppError('Invalid user type for this account', 400);
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.userType);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Authentication error:', error);
    throw new AppError('Authentication failed', 500);
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, userType } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('defaultPassword123', 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      userType
    });

    await user.save();
    logger.info(`User registered: ${email} (${userType})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Registration error:', error);
    throw new AppError('Registration failed', 500);
  }
};