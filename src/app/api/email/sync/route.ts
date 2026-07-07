import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { fetchInboxEmails } from '@/lib/email';

async function getUserId(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  const { userId } = await verifyAccessToken(auth.slice(7));
  return userId;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const { accountId, smtpPassword, imapPassword } = body as {
      accountId: string;
      smtpPassword: string;
      imapPassword?: string;
    };

    if (!accountId || !smtpPassword) {
      return NextResponse.json({ error: 'accountId and smtpPassword are required' }, { status: 400 });
    }

    const account = await db.emailAccount.findFirst({ where: { id: accountId, userId } });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    let fetched: Awaited<ReturnType<typeof fetchInboxEmails>>;
    try {
      fetched = await fetchInboxEmails(account, { smtpPassword, imapPassword });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'IMAP error';
      return NextResponse.json({ error: `Sync failed: ${msg}` }, { status: 502 });
    }

    let inserted = 0;
    for (const email of fetched) {
      try {
        await db.emailMessage.upsert({
          where: { messageId: email.messageId },
          create: {
            accountId,
            messageId: email.messageId,
            direction: 'INBOUND',
            fromEmail: email.from,
            fromName: email.fromName,
            toEmail: account.fromEmail,
            subject: email.subject,
            body: email.body,
            bodyType: email.bodyType,
            isRead: false,
            receivedAt: email.receivedAt,
          },
          update: {},
        });
        inserted++;
      } catch { /* duplicate messageId — skip */ }
    }

    return NextResponse.json({ synced: inserted, total: fetched.length });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
