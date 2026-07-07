import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';

// Append-only — GET only. No POST/PATCH/DELETE routes exist for ActivityLog.
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { role } = await verifyAccessToken(token);
    if (role !== 'ADMIN' && role !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500);

    const logs = await db.activityLog.findMany({
      where: {
        userId: userId ?? undefined,
        action: (action as never) ?? undefined,
        entityType: entityType ?? undefined,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}
