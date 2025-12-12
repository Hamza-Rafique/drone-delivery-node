// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store Socket.IO instance globally
app.set('io', io);

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'drone-delivery-api',
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`New WebSocket connection: ${socket.id}`);

  socket.on('join-drone-room', (droneId: string) => {
    socket.join(`drone:${droneId}`);
    console.log(`Socket ${socket.id} joined drone room: ${droneId}`);
  });

  socket.on('join-order-room', (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`Socket ${socket.id} joined order room: ${orderId}`);
  });

  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log(`Socket ${socket.id} joined admin room`);
  });

  socket.on('disconnect', () => {
    console.log(`WebSocket disconnected: ${socket.id}`);
  });
});

// Simple auth endpoint for testing
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, userType } = req.body;
    
    if (!username || !userType) {
      return res.status(400).json({ error: 'Username and userType are required' });
    }

    // Simple token generation
    const token = jwt.sign(
      { 
        username, 
        userType, 
        userId: `user-${Date.now()}`,
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    );

    res.json({ 
      success: true,
      token, 
      user: { username, userType } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Test endpoints
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start server
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ WebSocket server running on port 3001`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Starting graceful shutdown...');
  httpServer.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

export { app, io };