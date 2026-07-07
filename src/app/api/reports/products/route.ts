import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await verifyAccessToken(token);

    const topInvoiceProducts = await db.invoiceItem.groupBy({
      by: ['description'],
      _sum: { total: true, quantity: true },
      _count: true,
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });

    const topProducts = topInvoiceProducts.map((r) => ({
      name: r.description,
      revenue: Number(r._sum.total ?? 0),
      quantity: Number(r._sum.quantity ?? 0),
      count: r._count,
    }));

    return NextResponse.json({ topProducts });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
