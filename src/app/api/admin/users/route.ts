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
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const users = await db.user.findMany({
      where: search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : undefined,
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { activityLogs: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === 'Forbidden') return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
