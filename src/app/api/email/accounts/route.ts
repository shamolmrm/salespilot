import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { CreateEmailAccountSchema } from '@/lib/validations/email';

async function getUserId(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  const { userId } = await verifyAccessToken(auth.slice(7));
  return userId;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const accounts = await db.emailAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        fromEmail: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
        imapHost: true,
        imapPort: true,
        imapSecure: true,
        imapUser: true,
        createdAt: true,
      },
    });
    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const parsed = CreateEmailAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { smtpPassword, imapPassword, ...accountData } = parsed.data;

    const account = await db.emailAccount.create({
      data: { ...accountData, userId },
    });

    // Credentials are returned to the client so it can store them via IPC / safeStorage
    return NextResponse.json(
      { ...account, smtpPassword, imapPassword },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
