import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import { jwtConfig } from '../src/config/jwt';

describe('Authentication System', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login admin user and return JWT', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          name: 'Admin1',
          role: 'admin',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toMatchObject({
        name: 'Admin1',
        role: 'admin',
      });

      // Verify user was created in database
      const user = await User.findOne({ name: 'Admin1', role: 'admin' });
      expect(user).toBeDefined();
    });

    it('should login drone user and return JWT', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          name: 'Drone-001',
          role: 'drone',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('drone');
    });

    it('should login enduser and return JWT', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          name: 'Customer123',
          role: 'enduser',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('enduser');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          role: 'admin',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for missing role', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          name: 'TestUser',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          name: 'TestUser',
          role: 'invalid_role',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid role');
    });

    it('should return same user on subsequent logins', async () => {
      // First login
      const firstLogin = await request(app)
        .post('/api/auth/login')
        .send({
          name: 'TestUser',
          role: 'admin',
        });

      const userId = firstLogin.body.user.id;

      // Second login
      const secondLogin = await request(app)
        .post('/api/auth/login')
        .send({
          name: 'TestUser',
          role: 'admin',
        });

      expect(secondLogin.body.user.id).toBe(userId);
    });
  });

  describe('GET /api/auth/verify', () => {
    let adminToken: string;

    beforeEach(async () => {
      // Create admin user and get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          name: 'VerifyAdmin',
          role: 'admin',
        });

      adminToken = loginResponse.body.token;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('VerifyAdmin');
      expect(response.body.user.role).toBe('admin');
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('No token provided');
    });

    it('should return 401 for invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
    });

    it('should return 401 for expired token', async () => {
      // Create an expired token
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 'test', role: 'admin', name: 'Test' },
        jwtConfig.secret,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      // Create token for non-existent user
      const jwt = require('jsonwebtoken');
      const fakeToken = jwt.sign(
        { userId: new mongoose.Types.ObjectId(), role: 'admin', name: 'Ghost' },
        jwtConfig.secret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Authentication Middleware', () => {
    let adminToken: string;
    let droneToken: string;

    beforeEach(async () => {
      // Create test users
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ name: 'MiddlewareAdmin', role: 'admin' });
      adminToken = adminLogin.body.token;

      const droneLogin = await request(app)
        .post('/api/auth/login')
        .send({ name: 'MiddlewareDrone', role: 'drone' });
      droneToken = droneLogin.body.token;
    });

    it('should allow access with valid admin token', async () => {
      // Test with a protected route (using verify endpoint)
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject access without token to protected routes', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
    });
  });
});