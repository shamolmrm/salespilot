import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveFile } from '@/lib/document-storage';
import { extractTextFromFile } from '@/lib/ocr';
import { writeLog } from '@/lib/activity-log';

const include = { folder: { select: { id: true, name: true } }, createdBy: { select: { id: true, name: true } }, _count: { select: { versions: true } } };

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await verifyAccessToken(token);
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');
    const search = searchParams.get('search');
    const docs = await db.document.findMany({
      where: { folderId: folderId ?? undefined, name: search ? { contains: search, mode: 'insensitive' } : undefined },
      include, orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(docs);
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId } = await verifyAccessToken(token);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;
    const folderId = formData.get('folderId') as string | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = await saveFile(buffer, file.name);
    const ocrText = await extractTextFromFile(buffer, file.type);

    const doc = await db.document.create({
      data: {
        name: (name ?? file.name).slice(0, 500),
        folderId: folderId ?? null,
        fileSize: buffer.length,
        mimeType: file.type,
        storagePath,
        ocrText,
        createdByUserId: userId,
      },
      include,
    });

    // Create version 1
    await db.documentVersion.create({ data: { documentId: doc.id, versionNumber: 1, storagePath, fileSize: buffer.length, createdByUserId: userId } });
    await writeLog({ userId, action: 'CREATE', entityType: 'Document', entityId: doc.id, metadata: { name: doc.name } });

    return NextResponse.json(doc, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 }); }
}
