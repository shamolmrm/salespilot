import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeLog } from '@/lib/activity-log';
import { z } from 'zod';

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  const user = await verifyAccessToken(token);
  if (user.role !== 'ADMIN') throw new Error('Forbidden');
  return user;
}

const UpdateSchema = z.object({ name: z.string().min(1).max(200).optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAdmin(req);
    const { id } = await params;
    const parsed = UpdateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const updated = await db.user.update({ where: { id }, data: parsed.data, select: { id: true, name: true, email: true, role: true, createdAt: true } });
    await writeLog({ userId, action: 'UPDATE', entityType: 'User', entityId: id, metadata: parsed.data });
    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === 'Forbidden') return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAdmin(req);
    const { id } = await params;
    if (id === userId) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    await db.user.delete({ where: { id } });
    await writeLog({ userId, action: 'DELETE', entityType: 'User', entityId: id });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === 'Forbidden') return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
