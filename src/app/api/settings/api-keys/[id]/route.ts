import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { writeLog } from '@/lib/activity-log';
import { hash, compare } from 'bcryptjs';
import { z } from 'zod';

const RevealSchema = z.object({ password: z.string().min(1) });

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  const user = await verifyAccessToken(token);
  if (user.role !== 'ADMIN') throw new Error('Forbidden');
  return user;
}

// Require password re-authentication before revealing a plaintext API key
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAdmin(req);
    const { id } = await params;
    const parsed = RevealSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Password required' }, { status: 400 });

    const userRecord = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!userRecord) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const valid = await compare(parsed.data.password, userRecord.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });

    const record = await db.apiKeyRecord.findUnique({ where: { id }, select: { encryptedKey: true, service: true } });
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const plaintext = decrypt(record.encryptedKey);
    await db.apiKeyRecord.update({ where: { id }, data: { lastUsedAt: new Date() } });
    await writeLog({ userId, action: 'VIEW_SENSITIVE', entityType: 'ApiKeyRecord', entityId: id, metadata: { service: record.service } });

    return NextResponse.json({ key: plaintext });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === 'Forbidden') return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAdmin(req);
    const { id } = await params;
    await db.apiKeyRecord.delete({ where: { id } });
    await writeLog({ userId, action: 'DELETE', entityType: 'ApiKeyRecord', entityId: id });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'Unauthorized') return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === 'Forbidden') return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
