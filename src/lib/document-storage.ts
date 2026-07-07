import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? './uploads';
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function saveFile(buffer: Buffer, originalName: string, subDir = 'documents'): Promise<string> {
  const uploadDir = path.join(getUploadDir(), subDir);
  await ensureDir(uploadDir);

  const ext = path.extname(originalName);
  const fileName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);
  return path.join(subDir, fileName).replace(/\\/g, '/');
}

export async function deleteFile(relativePath: string): Promise<void> {
  const fullPath = path.join(getUploadDir(), relativePath);
  try {
    await fs.unlink(fullPath);
  } catch {
    // File may already be gone — not an error
  }
}

export async function readFile(relativePath: string): Promise<Buffer> {
  const fullPath = path.join(getUploadDir(), relativePath);
  return fs.readFile(fullPath);
}

export function getFileUrl(relativePath: string): string {
  return `/api/documents/file/${encodeURIComponent(relativePath)}`;
}
