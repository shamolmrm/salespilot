import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CreateDealSchema } from '@/lib/validations/deal';
import type { Prisma } from '@prisma/client';

function serializeDeal(deal: Record<string, unknown>) {
  return {
    ...deal,
    value: Number(deal.value),
    createdAt: (deal.createdAt as Date).toISOString(),
    updatedAt: (deal.updatedAt as Date).toISOString(),
    expectedCloseDate: deal.expectedCloseDate
      ? (deal.expectedCloseDate as Date).toISOString()
      : null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const stage = searchParams.get('stage') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;

  const where: Prisma.DealWhereInput = {};

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  if (stage) {
    where.stage = stage as Prisma.EnumDealStageFilter['equals'];
  }

  const [deals, total] = await Promise.all([
    db.deal.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.deal.count({ where }),
  ]);

  return NextResponse.json({
    deals: deals.map((d) => serializeDeal(d as unknown as Record<string, unknown>)),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateDealSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { customerId, expectedCloseDate, ...rest } = parsed.data;

  const deal = await db.deal.create({
    data: {
      ...rest,
      notes: rest.notes || null,
      customerId: customerId || null,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(
    serializeDeal(deal as unknown as Record<string, unknown>),
    { status: 201 },
  );
}
