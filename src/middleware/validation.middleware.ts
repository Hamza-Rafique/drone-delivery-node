import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      logger.warn('Validation error:', error.details);
      
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    next();
  };
};

// Validation schemas
export const authSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  userType: Joi.string().valid('admin', 'enduser', 'drone').required()
});

export const orderSchema = Joi.object({
  origin: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().optional()
  }).required(),
  destination: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().optional()
  }).required(),
  weight: Joi.number().min(0.1).max(10).required(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium')
});

export const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  address: Joi.string().optional()
});

export const droneStatusSchema = Joi.object({
  status: Joi.string().valid('idle', 'busy', 'broken', 'charging', 'maintenance').required()
});