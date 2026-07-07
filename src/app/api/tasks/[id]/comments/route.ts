import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const CreateCommentSchema = z.object({ content: z.string().min(1).max(5000) });

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id: taskId } = await params;
    const body = await req.json();
    const parsed = CreateCommentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const comment = await db.taskComment.create({
      data: { taskId, userId, content: parsed.data.content },
      include: { user: { select: { id: true, name: true } } },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}
