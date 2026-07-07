import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

const include = { createdBy: { select: { id: true, name: true } }, recipients: { take: 100, orderBy: { createdAt: 'desc' as const } }, _count: { select: { recipients: true } } };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getUser(req);
    const { id } = await params;
    const campaign = await db.campaign.findUnique({ where: { id }, include });
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(campaign);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await getUser(req);
    if (role !== 'ADMIN' && role !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    await db.campaign.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}
