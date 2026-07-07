import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CreateCustomerSchema } from '@/lib/validations/customer';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;

  const where: Prisma.CustomerWhereInput = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.customer.count({ where }),
  ]);

  return NextResponse.json({
    customers: customers.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { companyId, ...rest } = parsed.data;

  const customer = await db.customer.create({
    data: {
      ...rest,
      email: rest.email || null,
      phone: rest.phone || null,
      notes: rest.notes || null,
      companyId: companyId || null,
    },
    include: {
      company: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    {
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}
