import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { CreateConversationSchema } from '@/lib/validations/ai';

async function getUserId(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  const payload = await verifyAccessToken(auth.slice(7));
  return payload.userId;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const conversations = await db.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    return NextResponse.json(conversations);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const parsed = CreateConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const conversation = await db.conversation.create({
      data: {
        userId,
        title: parsed.data.title ?? 'New Conversation',
      },
    });
    return NextResponse.json(conversation, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
