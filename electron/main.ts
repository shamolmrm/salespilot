import { app, BrowserWindow, dialog, shell } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc/index';
import { startNextServer } from './utils/serverManager';
import { validateLicense } from './utils/license';
import { startSocketServer } from './utils/socketServer';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

// Inline loading page shown while the Next.js server warms up
const LOADING_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
body{background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;color:#f1f5f9;-webkit-app-region:drag}
.wrap{text-align:center}
.logo{font-size:28px;font-weight:700;letter-spacing:-0.5px}
.tagline{font-size:13px;color:#94a3b8;margin-top:6px}
.ring{width:28px;height:28px;border:3px solid rgba(96,165,250,0.2);border-top-color:#60a5fa;border-radius:50%;animation:spin 0.7s linear infinite;margin:20px auto 0}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body><div class="wrap"><div class="logo">SalesPilot CRM</div><div class="tagline">Starting…</div><div class="ring"></div></div></body></html>`;

function makeWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  win.on('closed', () => { mainWindow = null; });

  // F12 opens DevTools for debugging even in production
  win.webContents.on('before-input-event', (_evt, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  });

  return win;
}

// Returns false if the user chose to quit
async function checkAndSetupDatabase(port: number): Promise<boolean> {
  const userData = app.getPath('userData');
  const envPath = `${userData}\\.env`;

  // 1. Try to auto-create tables + seed admin
  try {
    const setupRes = await fetch(`http://localhost:${port}/api/setup`, {
      method: 'POST',
      signal: AbortSignal.timeout(25_000),
    });
    const setupData = await setupRes.json().catch(() => ({})) as Record<string, unknown>;
    if (setupRes.ok) {
      console.log('[main] DB setup OK:', setupData);
      return true;
    }
    // Setup failed — show dialog with the real reason
    const reason = (setupData.error as string | undefined) ?? 'Unknown error';
    const choice = await dialog.showMessageBox({
      type: 'warning',
      title: 'SalesPilot — Database Setup Failed',
      message: 'Cannot connect to or set up the database.',
      detail:
        `Error: ${reason}\n\n` +
        `What to check:\n` +
        `  1. PostgreSQL চালু আছে কিনা (localhost:5432)\n` +
        `  2. "salespilot" database তৈরি আছে কিনা\n` +
        `  3. .env ফাইলে DATABASE_URL সঠিক আছে কিনা\n\n` +
        `Config file: ${envPath}`,
      buttons: ['.env ফাইল খুলুন', 'তবুও চালু করুন', 'বন্ধ করুন'],
      defaultId: 0,
      cancelId: 2,
    });
    if (choice.response === 0) { shell.openPath(envPath); }
    if (choice.response === 2) { app.quit(); return false; }
    return true;
  } catch (e) {
    // Network error — server might not have started yet, proceed anyway
    console.warn('[main] DB check failed:', e);
    return true;
  }
}

app.whenReady().then(async () => {
  validateLicense();
  registerIpcHandlers();
  startSocketServer(parseInt(process.env.SOCKET_PORT ?? '3001', 10));

  mainWindow = makeWindow();

  // Show the loading screen immediately so the user knows something is happening
  await mainWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(LOADING_HTML)}`,
  );
  mainWindow.show();

  if (isDev) {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
    return;
  }

  try {
    const port = await startNextServer();

    // Check DB status and auto-setup on first run
    const dbOk = await checkAndSetupDatabase(port);
    if (!dbOk) return; // user chose to quit from the dialog

    await mainWindow.loadURL(`http://localhost:${port}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const userData = app.getPath('userData');
    dialog.showErrorBox(
      'SalesPilot CRM — Failed to start',
      `The application server could not be started.\n\nDetails: ${msg}\n\n` +
      `Checklist:\n` +
      `  1. PostgreSQL is running on localhost:5432\n` +
      `  2. Database "salespilot" exists\n` +
      `  3. DATABASE_URL in .env matches your PostgreSQL setup\n\n` +
      `Configuration file location:\n` +
      `  ${userData}\\.env\n\n` +
      `If that file does not exist, copy it from the installation folder\n` +
      `and edit the DATABASE_URL line with your PostgreSQL credentials.`,
    );
    app.quit();
  }
});

// Surface any uncaught main-process error to the user
process.on('uncaughtException', (err) => {
  console.error('[main] uncaughtException:', err);
  try {
    dialog.showErrorBox('SalesPilot — Unexpected Error', err.message ?? String(err));
  } catch { /* dialog may not be available before app.ready */ }
  app.quit();
});

process.on('unhandledRejection', (reason) => {
  console.error('[main] unhandledRejection:', reason);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = makeWindow();
    mainWindow.loadURL('http://localhost:3000').then(() => mainWindow?.show());
  }
});
