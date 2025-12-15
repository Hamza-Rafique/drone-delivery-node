import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.routes';
import droneRoutes from './routes/drone.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes.ts';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { authenticateToken } from './middleware/auth.middleware';

class App {
  public app: Application;
  private apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    
    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });

    // Apply rate limiting to all routes
    this.app.use(this.apiLimiter);
  }

  private initializeRoutes(): void {
    // Public routes
    this.app.use('/api/auth', authRoutes);

    // Protected routes
    this.app.use('/api/drones', authenticateToken, droneRoutes);
    this.app.use('/api/orders', authenticateToken, orderRoutes);
    this.app.use('/api/users', authenticateToken, userRoutes);
    this.app.use('/api/admin', authenticateToken, adminRoutes);

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Drone Delivery API'
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }
}

export default new App().app;