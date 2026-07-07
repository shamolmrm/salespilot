import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalLeads, newLeadsThisMonth, totalCustomers, deals, recentLeads] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.customer.count(),
    db.deal.findMany({
      where: { stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      select: { value: true },
    }),
    db.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    }),
  ]);

  const openDealValue = deals.reduce((sum, d) => sum + Number(d.value), 0);

  return NextResponse.json({
    totalLeads,
    newLeadsThisMonth,
    totalCustomers,
    totalDeals: deals.length,
    openDealValue,
    recentLeads: recentLeads.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })),
  });
}
