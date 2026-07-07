import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { SendEmailSchema } from '@/lib/validations/email';
import { sendEmail } from '@/lib/email';

async function getUserId(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  const { userId } = await verifyAccessToken(auth.slice(7));
  return userId;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const parsed = SendEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { accountId, to, subject, body: emailBody, bodyType } = parsed.data;

    const account = await db.emailAccount.findFirst({ where: { id: accountId, userId } });
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    // Credentials must be provided in the request body (they come from safeStorage on the client)
    const { smtpPassword, imapPassword } = body as {
      smtpPassword?: string;
      imapPassword?: string;
    };

    if (!smtpPassword) {
      return NextResponse.json({ error: 'SMTP password is required' }, { status: 400 });
    }

    let messageId: string;
    try {
      messageId = await sendEmail(account, { smtpPassword, imapPassword }, to, subject, emailBody, bodyType);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'SMTP error';
      return NextResponse.json({ error: `Failed to send email: ${msg}` }, { status: 502 });
    }

    const saved = await db.emailMessage.create({
      data: {
        accountId,
        messageId: messageId || undefined,
        direction: 'OUTBOUND',
        fromEmail: account.fromEmail,
        fromName: account.name,
        toEmail: to,
        subject,
        body: emailBody,
        bodyType,
        isRead: true,
        sentAt: new Date(),
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
