import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { UpdateDepartmentSchema } from '@/lib/validations/team';
import { writeLog } from '@/lib/activity-log';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await getUser(req);
    if (role !== 'ADMIN' && role !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateDepartmentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const dept = await db.department.update({ where: { id }, data: parsed.data, include: { manager: { select: { id: true, name: true } }, _count: { select: { employees: true } } } });
    await writeLog({ userId, action: 'UPDATE', entityType: 'Department', entityId: id, metadata: parsed.data });
    return NextResponse.json(dept);
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await getUser(req);
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    await db.department.delete({ where: { id } });
    await writeLog({ userId, action: 'DELETE', entityType: 'Department', entityId: id });
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}
