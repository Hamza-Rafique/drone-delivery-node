import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

// Define custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'http';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Format for console logging
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // Error log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Combined log file
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // HTTP log file
  new winston.transports.File({
    filename: 'logs/http.log',
    level: 'http',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create the logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
  exitOnError: false,
});

// If we're not in production, log to the console with a simpler format
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

// Express request logger middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Capture the response finish event
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Get user information if authenticated
    const userId = (req as AuthenticatedRequest).user?.userId || 'anonymous';
    const userType = (req as AuthenticatedRequest).user?.userType || 'guest';
    
    // Build log message
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error(message, {
        userId,
        userType,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        duration,
        body: req.body,
        query: req.query,
        params: req.params,
      });
    } else if (res.statusCode >= 400) {
      logger.warn(message, {
        userId,
        userType,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        duration,
      });
    } else {
      logger.http(message, {
        userId,
        userType,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        duration,
      });
    }
  });
  
  // Log request start
  logger.debug(`Request started: ${req.method} ${req.originalUrl}`, {
    userId: (req as AuthenticatedRequest).user?.userId || 'anonymous',
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  next();
}

// Function to log API events
export function logEvent(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  meta?: any
) {
  logger.log(level, message, meta);
}

// Function to log authentication events
export function logAuthEvent(
  event: 'login' | 'logout' | 'token_refresh' | 'failed_login',
  userId: string,
  userType: string,
  ip: string,
  additionalInfo?: any
) {
  logger.info(`Auth ${event}: ${userId} (${userType})`, {
    event,
    userId,
    userType,
    ip,
    ...additionalInfo,
  });
}

// Function to log order events
export function logOrderEvent(
  event: 'created' | 'updated' | 'delivered' | 'failed' | 'withdrawn' | 'handoff',
  orderId: string,
  droneId?: string,
  userId?: string,
  additionalInfo?: any
) {
  logger.info(`Order ${event}: ${orderId}`, {
    event,
    orderId,
    droneId,
    userId,
    ...additionalInfo,
  });
}

// Function to log drone events
export function logDroneEvent(
  event: 'status_change' | 'location_update' | 'job_reserved' | 'heartbeat',
  droneId: string,
  status?: string,
  location?: any,
  additionalInfo?: any
) {
  logger.info(`Drone ${event}: ${droneId}`, {
    event,
    droneId,
    status,
    location,
    ...additionalInfo,
  });
}

// Function to log database events
export function logDatabaseEvent(
  operation: 'connect' | 'disconnect' | 'query' | 'error',
  collection?: string,
  duration?: number,
  error?: any
) {
  if (operation === 'error') {
    logger.error(`Database ${operation}: ${error?.message}`, {
      operation,
      collection,
      duration,
      error: error?.stack || error,
    });
  } else {
    logger.debug(`Database ${operation}: ${collection || ''}`, {
      operation,
      collection,
      duration,
    });
  }
}

// Function to log errors with context
export function logError(
  error: Error,
  context: string,
  req?: Request,
  additionalInfo?: any
) {
  logger.error(`Error in ${context}: ${error.message}`, {
    context,
    error: error.stack,
    request: req ? {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req as AuthenticatedRequest).user?.userId,
    } : undefined,
    ...additionalInfo,
  });
}

// Create a stream object for Morgan integration (optional)
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};