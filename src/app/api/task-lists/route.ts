import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const Schema = z.object({ name: z.string().min(1).max(100), color: z.string().optional() });

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

export async function GET(req: NextRequest) {
  try {
    await getUser(req);
    const lists = await db.taskList.findMany({ include: { _count: { select: { tasks: true } } }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json(lists);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getUser(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const list = await db.taskList.create({ data: { ...parsed.data, createdByUserId: userId }, include: { _count: { select: { tasks: true } } } });
    return NextResponse.json(list, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 }); }
}
