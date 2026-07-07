import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import type { DealStage } from '@/types';

const MoveSchema = z.object({
  dealId: z.string().min(1),
  stage: z.enum([
    'PROSPECTING',
    'QUALIFICATION',
    'PROPOSAL',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST',
  ]),
});

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

export async function GET() {
  const deals = await db.deal.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  const board: Record<DealStage, ReturnType<typeof serializeDeal>[]> = {
    PROSPECTING: [],
    QUALIFICATION: [],
    PROPOSAL: [],
    NEGOTIATION: [],
    CLOSED_WON: [],
    CLOSED_LOST: [],
  };

  for (const deal of deals) {
    board[deal.stage as DealStage].push(serializeDeal(deal as unknown as Record<string, unknown>));
  }

  return NextResponse.json(board);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = MoveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dealId, stage } = parsed.data;

  const deal = await db.deal.update({
    where: { id: dealId },
    data: { stage },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(serializeDeal(deal as unknown as Record<string, unknown>));
}
