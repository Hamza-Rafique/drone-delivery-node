import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { logger } from './middleware/logger';

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

// HTTP logger (morgan)
app.use(morgan('dev'));

/* ---------- ROUTES ---------- */
app.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

export default app;
