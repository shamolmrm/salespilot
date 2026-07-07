import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteFile } from '@/lib/document-storage';
import { writeLog } from '@/lib/activity-log';

const include = { folder: { select: { id: true, name: true } }, createdBy: { select: { id: true, name: true } }, versions: { orderBy: { versionNumber: 'desc' as const } } };

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getUser(req);
    const { id } = await params;
    const doc = await db.document.findUnique({ where: { id }, include });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(doc);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id } = await params;
    const { name, folderId } = await req.json();
    const doc = await db.document.update({ where: { id }, data: { ...(name ? { name: String(name).slice(0, 500) } : {}), ...(folderId !== undefined ? { folderId } : {}) }, include });
    await writeLog({ userId, action: 'UPDATE', entityType: 'Document', entityId: id });
    return NextResponse.json(doc);
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await getUser(req);
    const { id } = await params;
    const doc = await db.document.findUnique({ where: { id }, include: { versions: true } });
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await db.document.delete({ where: { id } });
    // Clean up stored files
    await deleteFile(doc.storagePath);
    for (const v of doc.versions) { await deleteFile(v.storagePath); }
    await writeLog({ userId, action: 'DELETE', entityType: 'Document', entityId: id });
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}
