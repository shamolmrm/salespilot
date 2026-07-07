import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const admin = await db.user.upsert({
    where: { email: 'admin@salespilot.local' },
    update: {},
    create: {
      email: 'admin@salespilot.local',
      name: 'System Admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`Seeded admin user: ${admin.email}`);
  console.log('Default password: Admin@123  — change this immediately after first login.');

  // Seed a demo company
  const company = await db.company.upsert({
    where: { id: 'demo-company-1' },
    update: {},
    create: {
      id: 'demo-company-1',
      name: 'Acme Corporation',
      industry: 'Technology',
      website: 'https://acme.example.com',
    },
  });

  // Seed demo leads
  await db.lead.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'demo-lead-1',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '+1-555-0101',
        status: 'NEW',
        source: 'WEBSITE',
        companyId: company.id,
        assignedToId: admin.id,
      },
      {
        id: 'demo-lead-2',
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        phone: '+1-555-0102',
        status: 'CONTACTED',
        source: 'REFERRAL',
        assignedToId: admin.id,
      },
    ],
  });

  // Seed demo customer
  const customer = await db.customer.upsert({
    where: { id: 'demo-customer-1' },
    update: {},
    create: {
      id: 'demo-customer-1',
      firstName: 'Carol',
      lastName: 'Williams',
      email: 'carol@example.com',
      phone: '+1-555-0200',
      companyId: company.id,
      assignedToId: admin.id,
    },
  });

  // Seed demo deals
  await db.deal.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'demo-deal-1',
        title: 'Enterprise License — Acme Corp',
        value: 25000,
        stage: 'PROPOSAL',
        priority: 'HIGH',
        customerId: customer.id,
        assignedToId: admin.id,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'demo-deal-2',
        title: 'Starter Pack — New Prospect',
        value: 5000,
        stage: 'PROSPECTING',
        priority: 'MEDIUM',
        assignedToId: admin.id,
      },
      {
        id: 'demo-deal-3',
        title: 'Annual Renewal — Carol Williams',
        value: 12000,
        stage: 'NEGOTIATION',
        priority: 'HIGH',
        customerId: customer.id,
        assignedToId: admin.id,
      },
    ],
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
