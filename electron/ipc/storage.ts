import { safeStorage, app } from 'electron';
import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(app.getPath('userData'), 'rt.enc');

export function storeRefreshToken(token: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS-level encryption is not available on this machine');
  }
  const encrypted = safeStorage.encryptString(token);
  fs.writeFileSync(TOKEN_PATH, encrypted);
}

export function getRefreshToken(): string | null {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  try {
    const data = fs.readFileSync(TOKEN_PATH);
    return safeStorage.decryptString(data);
  } catch {
    // Corrupted or encrypted by a different OS user — treat as missing
    return null;
  }
}

export function clearRefreshToken(): void {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
  }
}
