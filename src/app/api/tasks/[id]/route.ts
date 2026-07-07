import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { writeLog } from '@/lib/activity-log';

const UpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignedToId: z.string().cuid().optional().nullable(),
  taskListId: z.string().cuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
  labelIds: z.array(z.string().cuid()).optional(),
});

const include = {
  assignedTo: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  taskList: { select: { id: true, name: true } },
  labels: { include: { label: true } },
  _count: { select: { comments: true } },
};

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getUser(req);
    const { id } = await params;
    const task = await db.task.findUnique({ where: { id }, include: { ...include, comments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' } } } });
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(task);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { labelIds, dueDate, assignedToId, taskListId, ...rest } = parsed.data;
    const task = await db.task.update({
      where: { id },
      data: {
        ...rest,
        dueDate: dueDate === null ? null : dueDate ? new Date(dueDate) : undefined,
        assignedToId: assignedToId === undefined ? undefined : assignedToId ?? null,
        taskListId: taskListId === undefined ? undefined : taskListId ?? null,
        ...(labelIds !== undefined ? { labels: { deleteMany: {}, create: labelIds.map((lid) => ({ taskLabelId: lid })) } } : {}),
      },
      include,
    });
    await writeLog({ userId, action: 'UPDATE', entityType: 'Task', entityId: id });
    return NextResponse.json(task);
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id } = await params;
    await db.task.delete({ where: { id } });
    await writeLog({ userId, action: 'DELETE', entityType: 'Task', entityId: id });
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}
