import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const Schema = z.object({ name: z.string().min(1).max(50), color: z.string().optional() });

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

export async function GET(req: NextRequest) {
  try {
    await getUser(req);
    return NextResponse.json(await db.taskLabel.findMany({ orderBy: { name: 'asc' } }));
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    await getUser(req);
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const label = await db.taskLabel.create({ data: parsed.data });
    return NextResponse.json(label, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 }); }
}
