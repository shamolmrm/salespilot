import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  const user = await verifyAccessToken(token);
  if (user.role !== 'ADMIN') throw new Error('Forbidden');
  return user;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [users, customers, invoices, payments, campaigns, documents, tasks] = await Promise.all([
      db.user.count(),
      db.customer.count(),
      db.invoice.count(),
      db.payment.count(),
      db.campaign.count(),
      db.document.count(),
      db.task.count(),
    ]);
    return NextResponse.json({ users, customers, invoices, payments, campaigns, documents, tasks });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === 'Forbidden') return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
