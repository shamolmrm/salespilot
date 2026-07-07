import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await verifyAccessToken(token);

    const [invoiceStats, quotationStats, paymentStats, leadStats] = await Promise.all([
      db.invoice.groupBy({ by: ['status'], _count: true, _sum: { total: true, amountPaid: true } }),
      db.quotation.groupBy({ by: ['status'], _count: true, _sum: { total: true } }),
      db.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true }, _count: true }),
      db.lead.groupBy({ by: ['status'], _count: true }),
    ]);

    const totalRevenue = Number(paymentStats._sum.amount ?? 0);
    const totalInvoiced = invoiceStats.reduce((s, r) => s + Number(r._sum.total ?? 0), 0);
    const paidInvoices = invoiceStats.find((r) => r.status === 'PAID')?._count ?? 0;
    const overdueInvoices = invoiceStats.find((r) => r.status === 'OVERDUE')?._count ?? 0;
    const totalLeads = leadStats.reduce((s, r) => s + r._count, 0);
    const convertedLeads = leadStats.find((r) => r.status === 'CONVERTED')?._count ?? 0;
    const acceptedQuotations = quotationStats.find((r) => r.status === 'ACCEPTED')?._count ?? 0;
    const totalQuotations = quotationStats.reduce((s, r) => s + r._count, 0);

    return NextResponse.json({
      totalRevenue,
      totalInvoiced,
      paidInvoices,
      overdueInvoices,
      totalLeads,
      convertedLeads,
      acceptedQuotations,
      totalQuotations,
      invoicesByStatus: invoiceStats.map((r) => ({ status: r.status, count: r._count, total: Number(r._sum.total ?? 0) })),
      leadsByStatus: leadStats.map((r) => ({ status: r.status, count: r._count })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
