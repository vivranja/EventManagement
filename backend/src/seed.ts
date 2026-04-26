import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminPass = await bcrypt.hash('admin1234', 12);
  const plannerPass = await bcrypt.hash('planner1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@eventflow.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@eventflow.com', password: adminPass, role: 'ADMIN' },
  });

  const planner = await prisma.user.upsert({
    where: { email: 'planner@eventflow.com' },
    update: {},
    create: { name: 'Demo Planner', email: 'planner@eventflow.com', password: plannerPass, role: 'PLANNER' },
  });

  const project = await prisma.project.upsert({
    where: { shareToken: 'demo-token-1234' },
    update: {},
    create: {
      name: 'Grand Ballroom Gala',
      description: 'Annual charity fundraiser event',
      venueWidth: 1200,
      venueHeight: 900,
      eventDate: new Date('2025-06-15'),
      ownerId: planner.id,
      shareToken: 'demo-token-1234',
    },
  });

  const sampleLayout = {
    version: '1.0',
    venueWidth: 1200,
    venueHeight: 900,
    background: '#f8f6f0',
    gridSize: 20,
    elements: [
      { id: 'el-1', type: 'stage', x: 450, y: 50, width: 300, height: 120, rotation: 0, fill: '#4a5568', stroke: '#2d3748', strokeWidth: 2, label: 'Stage', seats: 0, opacity: 1, locked: false, zIndex: 1 },
      { id: 'el-2', type: 'round-table', x: 200, y: 300, width: 90, height: 90, rotation: 0, fill: '#c8a97e', stroke: '#8b6914', strokeWidth: 2, label: 'Table 1', seats: 8, opacity: 1, locked: false, zIndex: 2 },
      { id: 'el-3', type: 'round-table', x: 400, y: 300, width: 90, height: 90, rotation: 0, fill: '#c8a97e', stroke: '#8b6914', strokeWidth: 2, label: 'Table 2', seats: 8, opacity: 1, locked: false, zIndex: 3 },
      { id: 'el-4', type: 'round-table', x: 600, y: 300, width: 90, height: 90, rotation: 0, fill: '#c8a97e', stroke: '#8b6914', strokeWidth: 2, label: 'Table 3', seats: 8, opacity: 1, locked: false, zIndex: 4 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await prisma.layout.create({
    data: {
      projectId: project.id,
      name: 'Main Layout v1',
      layoutJson: sampleLayout,
      version: 1,
    },
  });

  console.log('✅ Seed complete!');
  console.log('   admin@eventflow.com / admin1234');
  console.log('   planner@eventflow.com / planner1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
