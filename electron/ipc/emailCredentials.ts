import { safeStorage, app } from 'electron';
import fs from 'fs';
import path from 'path';

const CREDS_PATH = path.join(app.getPath('userData'), 'email-creds.enc');

interface EmailCredentialSet {
  [accountId: string]: { smtpPassword: string; imapPassword?: string };
}

function readAll(): EmailCredentialSet {
  if (!fs.existsSync(CREDS_PATH)) return {};
  try {
    const data = fs.readFileSync(CREDS_PATH);
    const json = safeStorage.decryptString(data);
    return JSON.parse(json) as EmailCredentialSet;
  } catch {
    return {};
  }
}

function writeAll(creds: EmailCredentialSet): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS-level encryption is not available on this machine');
  }
  const encrypted = safeStorage.encryptString(JSON.stringify(creds));
  fs.writeFileSync(CREDS_PATH, encrypted);
}

export function storeEmailCredentials(
  accountId: string,
  smtpPassword: string,
  imapPassword?: string,
): void {
  const all = readAll();
  all[accountId] = { smtpPassword, imapPassword };
  writeAll(all);
}

export function getEmailCredentials(
  accountId: string,
): { smtpPassword: string; imapPassword?: string } | null {
  const all = readAll();
  return all[accountId] ?? null;
}

export function clearEmailCredentials(accountId: string): void {
  const all = readAll();
  delete all[accountId];
  writeAll(all);
}
