import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CreateLeadSchema } from '@/lib/validations/lead';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;

  const where: Prisma.LeadWhereInput = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status as Prisma.EnumLeadStatusFilter['equals'];
  }

  const [leads, total] = await Promise.all([
    db.lead.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.lead.count({ where }),
  ]);

  return NextResponse.json({
    leads: leads.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateLeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { companyId, ...rest } = parsed.data;

  const lead = await db.lead.create({
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
      ...lead,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}
