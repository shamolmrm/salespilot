import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { readFile } from '@/lib/document-storage';
import path from 'path';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const token = req.headers.get('authorization')?.slice(7);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await verifyAccessToken(token);

    const { path: segments } = await params;
    // Prevent directory traversal
    const relativePath = segments.map((s) => path.basename(s)).join('/');
    const buffer = await readFile(relativePath);

    // Derive Content-Type from extension
    const ext = path.extname(relativePath).toLowerCase();
    const mime: Record<string, string> = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.txt': 'text/plain', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    const contentType = mime[ext] ?? 'application/octet-stream';

    return new NextResponse(new Uint8Array(buffer), { headers: { 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${path.basename(relativePath)}"` } });
  } catch { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
}
