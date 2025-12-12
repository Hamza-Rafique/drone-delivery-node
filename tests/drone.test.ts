// tests/drone.test.ts
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';
import { authService } from '../src/services/auth.service';

describe('Drone API', () => {
  let droneToken: string;
  let enduserToken: string;
  let droneId: string;
  let orderId: string;

  beforeAll(async () => {
    // Setup test data
    await prisma.user.createMany({
      data: [
        {
          id: 'test-drone-1',
          username: 'drone-alpha',
          userType: 'DRONE',
          password: 'hashed-password',
        },
        {
          id: 'test-user-1',
          username: 'test-user',
          userType: 'ENDUSER',
          password: 'hashed-password',
        },
      ],
    });

    await prisma.drone.create({
      data: {
        id: 'drone-1',
        name: 'test-drone',
        status: 'AVAILABLE',
        currentLat: 40.7128,
        currentLng: -74.0060,
        batteryLevel: 100,
      },
    });

    droneToken = authService.generateToken({
      userId: 'test-drone-1',
      username: 'drone-alpha',
      userType: 'DRONE',
    });

    enduserToken = authService.generateToken({
      userId: 'test-user-1',
      username: 'test-user',
      userType: 'ENDUSER',
    });
  });

  afterAll(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "User", "Drone", "Order" CASCADE`;
    await prisma.$disconnect();
  });

  describe('POST /api/drones/heartbeat', () => {
    it('should update drone heartbeat', async () => {
      const response = await request(app)
        .post('/api/drones/heartbeat')
        .set('Authorization', `Bearer ${droneToken}`)
        .send({
          lat: 40.7580,
          lng: -73.9855,
          batteryLevel: 95,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('lastHeartbeat');
      expect(response.body.data.batteryLevel).toBe(95);
    });

    it('should reject unauthorized access', async () => {
      const response = await request(app)
        .post('/api/drones/heartbeat')
        .set('Authorization', `Bearer ${enduserToken}`)
        .send({
          lat: 40.7580,
          lng: -73.9855,
          batteryLevel: 95,
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/drones/reserve-job', () => {
    beforeEach(async () => {
      // Create a test order
      const order = await prisma.order.create({
        data: {
          userId: 'test-user-1',
          originLat: 40.7128,
          originLng: -74.0060,
          destLat: 40.7580,
          destLng: -73.9855,
          status: 'PENDING',
        },
      });
      orderId = order.id;
    });

    it('should reserve a job for drone', async () => {
      const response = await request(app)
        .post('/api/drones/reserve-job')
        .set('Authorization', `Bearer ${droneToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('ASSIGNED');
    });
  });

  describe('POST /api/drones/report-broken', () => {
    it('should create handoff request when drone reports broken', async () => {
      // First reserve a job
      await request(app)
        .post('/api/drones/reserve-job')
        .set('Authorization', `Bearer ${droneToken}`);

      const response = await request(app)
        .post('/api/drones/report-broken')
        .set('Authorization', `Bearer ${droneToken}`)
        .send({
          lat: 40.7489,
          lng: -73.9680,
          reason: 'Motor failure',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('status', 'PENDING');
      expect(response.body.data).toHaveProperty('orderId');
    });
  });
});