import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';

async function getUserId(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  const { userId } = await verifyAccessToken(auth.slice(7));
  return userId;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = 30;

    const where = accountId
      ? { account: { userId }, accountId, direction: 'INBOUND' as const }
      : { account: { userId }, direction: 'INBOUND' as const };

    const [total, emails] = await db.$transaction([
      db.emailMessage.count({ where }),
      db.emailMessage.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          accountId: true,
          fromEmail: true,
          fromName: true,
          subject: true,
          isRead: true,
          receivedAt: true,
          body: true,
          bodyType: true,
        },
      }),
    ]);

    return NextResponse.json({ emails, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
