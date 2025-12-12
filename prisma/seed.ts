import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.handoffRequest.deleteMany();
  await prisma.order.deleteMany();
  await prisma.drone.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      userType: 'ADMIN',
      password: hashedPassword,
    },
  });

  // Create enduser
  const enduser = await prisma.user.create({
    data: {
      username: 'customer1',
      userType: 'ENDUSER',
      password: await bcrypt.hash('customer123', 10),
    },
  });

  // Create drone user
  const droneUser = await prisma.user.create({
    data: {
      username: 'drone-alpha-user',
      userType: 'DRONE',
      password: '',
    },
  });

  // Create some drones
  const drones = await Promise.all([
    prisma.drone.create({
      data: {
        name: 'drone-alpha',
        status: 'AVAILABLE',
        currentLat: 40.7128,
        currentLng: -74.0060,
        batteryLevel: 100,
      },
    }),
    prisma.drone.create({
      data: {
        name: 'drone-beta',
        status: 'AVAILABLE',
        currentLat: 40.7580,
        currentLng: -73.9855,
        batteryLevel: 85,
      },
    }),
    prisma.drone.create({
      data: {
        name: 'drone-gamma',
        status: 'MAINTENANCE',
        currentLat: 40.7489,
        currentLng: -73.9680,
        batteryLevel: 90,
      },
    }),
  ]);

  // Create a sample order
  const order = await prisma.order.create({
    data: {
      userId: enduser.id,
      originLat: 40.7128,
      originLng: -74.0060,
      destLat: 40.7589,
      destLng: -73.9851,
      status: 'PENDING',
      weight: 2.5,
    },
  });

  console.log(`✅ Created admin user: ${admin.username}`);
  console.log(`✅ Created enduser: ${enduser.username}`);
  console.log(`✅ Created ${drones.length} drones`);
  console.log(`✅ Created sample order: ${order.id}`);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e?.error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });