import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';

async function getUserId(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  const { userId } = await verifyAccessToken(auth.slice(7));
  return userId;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const { id } = await params;
    const account = await db.emailAccount.findFirst({ where: { id, userId } });
    if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await db.emailAccount.delete({ where: { id } });
    // Return id so client can clear credentials from safeStorage
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
