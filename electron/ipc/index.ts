import { ipcMain } from 'electron';
import { storeRefreshToken, getRefreshToken, clearRefreshToken } from './storage';
import {
  storeEmailCredentials,
  getEmailCredentials,
  clearEmailCredentials,
} from './emailCredentials';

export function registerIpcHandlers(): void {
  // Auth token storage
  ipcMain.handle('store-refresh-token', (_event, token: string) => {
    storeRefreshToken(token);
  });
  ipcMain.handle('get-refresh-token', () => {
    return getRefreshToken();
  });
  ipcMain.handle('clear-refresh-token', () => {
    clearRefreshToken();
  });

  // Email credential storage (encrypted at rest via OS credential store)
  ipcMain.handle(
    'store-email-credentials',
    (_event, accountId: string, smtpPassword: string, imapPassword?: string) => {
      storeEmailCredentials(accountId, smtpPassword, imapPassword);
    },
  );
  ipcMain.handle('get-email-credentials', (_event, accountId: string) => {
    return getEmailCredentials(accountId);
  });
  ipcMain.handle('clear-email-credentials', (_event, accountId: string) => {
    clearEmailCredentials(accountId);
  });
}
