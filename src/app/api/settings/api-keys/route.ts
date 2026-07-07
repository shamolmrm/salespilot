import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt, maskKey } from '@/lib/encryption';
import { writeLog } from '@/lib/activity-log';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  service: z.string().min(1).max(100),
  key: z.string().min(1),
});

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  const user = await verifyAccessToken(token);
  if (user.role !== 'ADMIN') throw new Error('Forbidden');
  return user;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    // Never return encryptedKey — only maskedKey
    const records = await db.apiKeyRecord.findMany({
      select: { id: true, name: true, service: true, maskedKey: true, lastUsedAt: true, createdAt: true, createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === 'Forbidden') return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAdmin(req);
    const parsed = CreateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const encryptedKey = encrypt(parsed.data.key);
    const maskedKey = maskKey(parsed.data.key);

    const record = await db.apiKeyRecord.create({
      data: { name: parsed.data.name, service: parsed.data.service, encryptedKey, maskedKey, createdByUserId: userId },
      select: { id: true, name: true, service: true, maskedKey: true, createdAt: true, createdBy: { select: { id: true, name: true } } },
    });

    await writeLog({ userId, action: 'CREATE', entityType: 'ApiKeyRecord', entityId: record.id, metadata: { service: record.service } });
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === 'Forbidden') return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
