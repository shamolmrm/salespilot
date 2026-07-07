import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { CreateEmployeeSchema } from '@/lib/validations/team';
import { writeLog } from '@/lib/activity-log';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

const include = { user: { select: { id: true, name: true, email: true, role: true } }, department: { select: { id: true, name: true } } };

export async function GET(req: NextRequest) {
  try {
    await getUser(req);
    const { searchParams } = new URL(req.url);
    const deptId = searchParams.get('departmentId');
    const employees = await db.employee.findMany({
      where: { departmentId: deptId ?? undefined },
      include,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(employees);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getUser(req);
    if (role !== 'ADMIN' && role !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const parsed = CreateEmployeeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { startDate, ...rest } = parsed.data;
    const emp = await db.employee.create({ data: { ...rest, startDate: startDate ? new Date(startDate) : null }, include });
    await writeLog({ userId, action: 'CREATE', entityType: 'Employee', entityId: emp.id });
    return NextResponse.json(emp, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 }); }
}
