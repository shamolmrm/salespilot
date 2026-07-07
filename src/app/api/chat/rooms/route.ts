import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().max(200).optional(),
  type: z.enum(['DIRECT', 'GROUP']).optional(),
  memberIds: z.array(z.string().cuid()).min(1),
});

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getUser(req);
    const rooms = await db.chatRoom.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(rooms);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getUser(req);
    const parsed = CreateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { memberIds, ...rest } = parsed.data;

    // Ensure creator is always a member
    const allMembers = Array.from(new Set([userId, ...memberIds]));
    const room = await db.chatRoom.create({
      data: {
        ...rest,
        createdByUserId: userId,
        members: { create: allMembers.map((id) => ({ userId: id })) },
      },
      include: { members: { include: { user: { select: { id: true, name: true } } } }, messages: { take: 1 } },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 }); }
}
