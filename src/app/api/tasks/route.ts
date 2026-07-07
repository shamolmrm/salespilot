import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { writeLog } from '@/lib/activity-log';
import { TaskStatus, TaskPriority } from '@prisma/client';

const CreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional(),
  taskListId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional(),
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

export async function GET(req: NextRequest) {
  try {
    await getUser(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const assignedToId = searchParams.get('assignedToId');
    const taskListId = searchParams.get('taskListId');

    const tasks = await db.task.findMany({
      where: {
        status: (status as never) ?? undefined,
        assignedToId: assignedToId ?? undefined,
        taskListId: taskListId ?? undefined,
      },
      include,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(tasks);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getUser(req);
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { labelIds, dueDate, status, priority, ...rest } = parsed.data;
    const task = await db.task.create({
      data: {
        ...rest,
        status: status as TaskStatus | undefined,
        priority: priority as TaskPriority | undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdByUserId: userId,
        labels: labelIds?.length ? { create: labelIds.map((id) => ({ taskLabelId: id })) } : undefined,
      },
      include,
    });
    await writeLog({ userId, action: 'CREATE', entityType: 'Task', entityId: task.id, metadata: { title: task.title } });
    return NextResponse.json(task, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 }); }
}
