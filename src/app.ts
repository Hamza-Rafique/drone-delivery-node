import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { logger } from './middleware/logger';
import { connectDB } from './config/database';
import { errorHandler } from "./middleware/errorHandler";
import { authLimiter, heartbeatLimiter } from './middleware/rateLimiter';
import { setupSwagger } from './swagger';


const app: Application = express();

/* ---------- GLOBAL MIDDLEWARE ---------- */

// Custom logger (your own)
app.use(logger);

// Body parser
app.use(express.json());

// CORS
app.use(cors());

// Security headers
app.use(helmet());

// Error handling middleware
app.use(errorHandler);

// HTTP logger (morgan)
app.use(morgan('dev'));

export const startServer = async () => {
  await connectDB();

  app.listen(process.env.PORT || 3000, () => {
    console.log('🚀 Server running');
  });
};
app.use("/api/auth/login", authLimiter);
app.use("/api/drones/heartbeat", heartbeatLimiter);

setupSwagger(app);
/* ---------- ROUTES ---------- */
app.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

export default app;
