import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await verifyAccessToken(token);

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const payments = await db.payment.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: start, lt: end } },
      select: { amount: true, currency: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const byMonth: Record<number, number> = {};
    for (let m = 0; m < 12; m++) byMonth[m] = 0;
    for (const p of payments) {
      const m = new Date(p.createdAt).getMonth();
      byMonth[m] += Number(p.amount);
    }

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = MONTHS.map((month, idx) => ({ month, revenue: byMonth[idx] }));

    const invoices = await db.invoice.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { total: true, amountPaid: true, status: true, createdAt: true },
    });

    const invoicesByMonth: Record<number, { total: number; paid: number }> = {};
    for (let m = 0; m < 12; m++) invoicesByMonth[m] = { total: 0, paid: 0 };
    for (const inv of invoices) {
      const m = new Date(inv.createdAt).getMonth();
      invoicesByMonth[m].total += Number(inv.total);
      invoicesByMonth[m].paid += Number(inv.amountPaid);
    }
    const invoiceMonthly = MONTHS.map((month, idx) => ({ month, invoiced: invoicesByMonth[idx].total, collected: invoicesByMonth[idx].paid }));

    return NextResponse.json({ year, monthly, invoiceMonthly, totalRevenue: payments.reduce((s, p) => s + Number(p.amount), 0) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
