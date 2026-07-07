import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { UpdateEmployeeSchema } from '@/lib/validations/team';
import { writeLog } from '@/lib/activity-log';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

const include = { user: { select: { id: true, name: true, email: true, role: true } }, department: { select: { id: true, name: true } } };

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await getUser(req);
    if (role !== 'ADMIN' && role !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateEmployeeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { startDate, ...rest } = parsed.data;
    const emp = await db.employee.update({ where: { id }, data: { ...rest, ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}) }, include });
    await writeLog({ userId, action: 'UPDATE', entityType: 'Employee', entityId: id, metadata: rest });
    return NextResponse.json(emp);
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await getUser(req);
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    await db.employee.delete({ where: { id } });
    await writeLog({ userId, action: 'DELETE', entityType: 'Employee', entityId: id });
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}
