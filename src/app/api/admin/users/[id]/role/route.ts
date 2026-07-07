import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeLog } from '@/lib/activity-log';
import { z } from 'zod';

// Role changes are logged to Activity Logs for privilege-escalation traceability
const Schema = z.object({ role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER']) });

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  const user = await verifyAccessToken(token);
  if (user.role !== 'ADMIN') throw new Error('Forbidden');
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAdmin(req);
    const { id } = await params;
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const before = await db.user.findUnique({ where: { id }, select: { role: true } });
    const updated = await db.user.update({ where: { id }, data: { role: parsed.data.role }, select: { id: true, name: true, email: true, role: true } });

    // Mandatory audit log for role changes
    await writeLog({ userId, action: 'ROLE_CHANGE', entityType: 'User', entityId: id, metadata: { from: before?.role, to: parsed.data.role } });

    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === 'Forbidden') return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
