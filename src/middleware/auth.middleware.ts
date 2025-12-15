import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, JwtPayload } from '../types';

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    }) as JwtPayload;

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('JWT verification error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        success: false,
        error: 'Invalid token'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.userType)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};