import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UpdateDealSchema } from '@/lib/validations/deal';

type Params = { params: Promise<{ id: string }> };

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

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const deal = await db.deal.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(serializeDeal(deal as unknown as Record<string, unknown>));
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateDealSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { customerId, expectedCloseDate, ...rest } = parsed.data;

  const deal = await db.deal.update({
    where: { id },
    data: {
      ...rest,
      notes: rest.notes ?? undefined,
      customerId: customerId !== undefined ? customerId || null : undefined,
      expectedCloseDate:
        expectedCloseDate !== undefined
          ? expectedCloseDate
            ? new Date(expectedCloseDate)
            : null
          : undefined,
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(serializeDeal(deal as unknown as Record<string, unknown>));
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await db.deal.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
