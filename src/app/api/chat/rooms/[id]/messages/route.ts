import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

const CreateSchema = z.object({
  content: z.string().min(1).max(10000),
  contentType: z.enum(['TEXT', 'VOICE']).optional(),
});

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

function sanitizeMessage(content: string): string {
  // Strip HTML tags — messages are stored as plain text, rendered as plain text
  return DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).slice(0, 10000);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id: roomId } = await params;
    // Verify membership
    const member = await db.chatRoomMember.findUnique({ where: { chatRoomId_userId: { chatRoomId: roomId, userId } } });
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const before = searchParams.get('before');
    const messages = await db.chatMessage.findMany({
      where: { chatRoomId: roomId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(messages.reverse());
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id: chatRoomId } = await params;
    const member = await db.chatRoomMember.findUnique({ where: { chatRoomId_userId: { chatRoomId, userId } } });
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const parsed = CreateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const sanitized = sanitizeMessage(parsed.data.content);
    const message = await db.chatMessage.create({
      data: { chatRoomId, userId, content: sanitized, contentType: parsed.data.contentType ?? 'TEXT' },
      include: { user: { select: { id: true, name: true } } },
    });
    await db.chatRoom.update({ where: { id: chatRoomId }, data: { updatedAt: new Date() } });
    return NextResponse.json(message, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 }); }
}
