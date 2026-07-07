import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { CreateDepartmentSchema } from '@/lib/validations/team';
import { writeLog } from '@/lib/activity-log';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getUser(req);
    void userId;
    const departments = await db.department.findMany({
      include: { manager: { select: { id: true, name: true, email: true } }, _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(departments);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getUser(req);
    if (role !== 'ADMIN' && role !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const parsed = CreateDepartmentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const dept = await db.department.create({ data: parsed.data, include: { manager: { select: { id: true, name: true } }, _count: { select: { employees: true } } } });
    await writeLog({ userId, action: 'CREATE', entityType: 'Department', entityId: dept.id, metadata: { name: dept.name } });
    return NextResponse.json(dept, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 }); }
}
