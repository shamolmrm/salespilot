import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { writeLog } from '@/lib/activity-log';

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['EMAIL', 'WHATSAPP', 'SMS']).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().max(50000).optional(),
  scheduledAt: z.string().datetime().optional(),
  recipients: z.array(z.object({ email: z.string().email(), name: z.string().optional() })).optional(),
});

const include = { createdBy: { select: { id: true, name: true } }, _count: { select: { recipients: true } } };

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

export async function GET(req: NextRequest) {
  try {
    await getUser(req);
    const campaigns = await db.campaign.findMany({ include, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(campaigns);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = await getUser(req);
    if (role !== 'ADMIN' && role !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { recipients, scheduledAt, ...rest } = parsed.data;
    const campaign = await db.campaign.create({
      data: {
        ...rest,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdByUserId: userId,
        targetCount: recipients?.length ?? 0,
        recipients: recipients?.length ? { create: recipients.map((r) => ({ email: r.email, name: r.name ?? null })) } : undefined,
      },
      include,
    });
    await writeLog({ userId, action: 'CREATE', entityType: 'Campaign', entityId: campaign.id, metadata: { name: campaign.name } });
    return NextResponse.json(campaign, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 }); }
}
