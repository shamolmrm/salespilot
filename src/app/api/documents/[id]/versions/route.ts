import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveFile } from '@/lib/document-storage';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId } = await verifyAccessToken(token);
    const { id: documentId } = await params;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const changeNote = formData.get('changeNote') as string | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = await saveFile(buffer, file.name);

    const lastVersion = await db.documentVersion.findFirst({ where: { documentId }, orderBy: { versionNumber: 'desc' } });
    const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const version = await db.documentVersion.create({
      data: { documentId, versionNumber, storagePath, fileSize: buffer.length, changeNote: changeNote ?? null, createdByUserId: userId },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    await db.document.update({ where: { id: documentId }, data: { storagePath, fileSize: buffer.length } });

    return NextResponse.json(version, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 }); }
}
