import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';

async function getUserId(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  const { userId } = await verifyAccessToken(auth.slice(7));
  return userId;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const { id } = await params;
    const email = await db.emailMessage.findFirst({ where: { id, account: { userId } } });
    if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await db.emailMessage.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
