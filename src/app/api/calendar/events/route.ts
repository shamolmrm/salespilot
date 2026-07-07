import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { CreateEventSchema } from '@/lib/validations/calendar';

async function getUserId(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  const { userId } = await verifyAccessToken(auth.slice(7));
  return userId;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const events = await db.calendarEvent.findMany({
      where: {
        userId,
        ...(from || to
          ? {
              startAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { startAt: 'asc' },
      take: 200,
    });

    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const parsed = CreateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const event = await db.calendarEvent.create({
      data: {
        ...parsed.data,
        userId,
        startAt: new Date(parsed.data.startAt),
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
        reminderAt: parsed.data.reminderAt ? new Date(parsed.data.reminderAt) : undefined,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
