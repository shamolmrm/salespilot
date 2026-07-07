import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeLog } from '@/lib/activity-log';

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  const user = await verifyAccessToken(token);
  if (user.role !== 'ADMIN') throw new Error('Forbidden');
  return user;
}

// No raw SQL is exposed. This endpoint exports records via Prisma ORM only.
export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAdmin(req);

    const [users, customers, products, quotations, invoices, payments, departments, employees, campaigns, tasks, settings] = await Promise.all([
      db.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      db.customer.findMany(),
      db.product.findMany(),
      db.quotation.findMany({ include: { items: true } }),
      db.invoice.findMany({ include: { items: true } }),
      db.payment.findMany(),
      db.department.findMany(),
      db.employee.findMany(),
      db.campaign.findMany({ include: { recipients: true } }),
      db.task.findMany(),
      db.companySettings.findMany(),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '4.0',
      data: { users, customers, products, quotations, invoices, payments, departments, employees, campaigns, tasks, settings },
    };

    await writeLog({ userId, action: 'BACKUP', entityType: 'System', metadata: { exportedAt: backup.exportedAt } });

    const json = JSON.stringify(backup, null, 2);
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="salespilot-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === 'Forbidden') return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
