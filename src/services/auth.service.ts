import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export interface JwtPayload {
  userId: string;
  username: string;
  userType: string;
}

export class AuthService {
  async login(username: string, userType: string): Promise<{ token: string; user: any }> {
    try {
      // For simplicity, we'll create user if not exists
      // In production, you'd have proper user registration
      let user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        // Create new user (drone or enduser)
        user = await prisma.user.create({
          data: {
            username,
            userType,
            password: await bcrypt.hash(username + Date.now(), 10),
          },
        });
      }

      // Validate user type
      if (user.userType !== userType) {
        throw new ApiError(403, 'Invalid user type for this login');
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id,
        username: user.username,
        userType: user.userType,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        token,
        user: userWithoutPassword,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw new ApiError(500, 'Login failed');
    }
  }

  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired token');
    }
  }

  async validateUser(userId: string, userType: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user !== null && user.userType === userType;
  }
}

export const authService = new AuthService();