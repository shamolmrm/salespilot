import net from 'net';
import path from 'path';
import fs from 'fs';

let serverPort: number | null = null;

/**
 * In a packaged Electron app, Next.js standalone server.js runs in production
 * mode and does NOT load .env files automatically. We load it here so that
 * DATABASE_URL and other secrets reach Prisma before the server script runs.
 *
 * Priority order (first found wins):
 *   1. %APPDATA%/SalesPilot/.env  — user's custom overrides
 *   2. <resourcesPath>/.env        — bundled defaults (copied by electron-builder)
 */
function loadEnvForProduction(): void {
  const { app } = require('electron') as typeof import('electron');
  if (!app.isPackaged) return; // dev: Next.js loads .env itself

  const userDataEnv = path.join(app.getPath('userData'), '.env');
  const bundledEnv = path.join(process.resourcesPath, '.env');

  // Always sync DATABASE_URL from bundled .env into userData .env.
  // This ensures that a reinstall with a new DB config takes effect immediately.
  // Other keys (JWT_SECRET, API keys etc.) set by the user are preserved.
  if (fs.existsSync(bundledEnv)) {
    try {
      fs.mkdirSync(path.dirname(userDataEnv), { recursive: true });
      if (!fs.existsSync(userDataEnv)) {
        // First run: copy everything
        fs.copyFileSync(bundledEnv, userDataEnv);
        console.log(`[env] First run — copied config to: ${userDataEnv}`);
      } else {
        // Subsequent runs: overwrite only DATABASE_URL, PORT, SOCKET_PORT from bundled .env
        // so a new installer always brings the correct DB connection string.
        const SYNC_KEYS = ['DATABASE_URL', 'PORT', 'SOCKET_PORT', 'NEXT_PUBLIC_SOCKET_PORT'];
        const bundledLines = fs.readFileSync(bundledEnv, 'utf8').split('\n');
        const userLines = fs.readFileSync(userDataEnv, 'utf8').split('\n');

        const bundledMap: Record<string, string> = {};
        for (const line of bundledLines) {
          const eq = line.indexOf('=');
          if (eq > 0) bundledMap[line.slice(0, eq).trim()] = line;
        }

        const updated = userLines.map((line) => {
          const eq = line.indexOf('=');
          if (eq < 1) return line;
          const key = line.slice(0, eq).trim();
          if (SYNC_KEYS.includes(key) && bundledMap[key]) return bundledMap[key];
          return line;
        });

        // Add any SYNC_KEYS that were missing in userDataEnv
        for (const key of SYNC_KEYS) {
          if (bundledMap[key] && !userLines.some((l) => l.startsWith(key + '='))) {
            updated.push(bundledMap[key]);
          }
        }

        fs.writeFileSync(userDataEnv, updated.join('\n'), 'utf8');
        console.log(`[env] Synced DB config into: ${userDataEnv}`);
      }
    } catch (e) {
      console.warn('[env] Could not sync .env to userData:', e);
    }
  }

  const candidates = [
    userDataEnv,
    bundledEnv,
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx < 1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        // Strip surrounding quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        // Don't override vars already set by the OS/parent environment
        if (!(key in process.env)) {
          process.env[key] = val;
        }
      }
      console.log(`[env] Loaded from: ${envPath}`);
      break;
    } catch (e) {
      console.warn(`[env] Failed to read ${envPath}:`, e);
    }
  }
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

// Poll until the HTTP server responds — tries both 127.0.0.1 and ::1 because
// Windows defaults for "localhost" vary across machine configs.
function waitForPort(port: number, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    function attempt() {
      if (Date.now() > deadline) {
        return reject(
          new Error(
            `Server on port ${port} did not respond within ${timeoutMs / 1000}s.\n\n` +
            `Make sure PostgreSQL is running and the "salespilot" database exists.`,
          ),
        );
      }
      // Try IPv4 first; if refused try after a short delay
      const sock = net.createConnection({ port, host: '127.0.0.1' });
      const timer = setTimeout(() => { sock.destroy(); }, 1000);
      sock.on('connect', () => {
        clearTimeout(timer);
        sock.destroy();
        resolve();
      });
      sock.on('error', () => {
        clearTimeout(timer);
        sock.destroy();
        setTimeout(attempt, 300);
      });
    }
    attempt();
  });
}

export async function startNextServer(): Promise<number> {
  if (serverPort !== null) return serverPort;

  // Load .env FIRST so DATABASE_URL and other secrets are available to the server
  loadEnvForProduction();

  const port = await getFreePort();
  const serverScript = path.join(process.resourcesPath, 'standalone', 'server.js');

  // Set env vars BEFORE requiring the server so they're visible to Next.js dotenv loading
  process.env.PORT = String(port);
  process.env.NODE_ENV = 'production';
  // Do NOT restrict HOSTNAME to 127.0.0.1 — Windows IPv6/IPv4 default varies.
  // Delete any stale HOSTNAME so Next.js listens on all interfaces (0.0.0.0 / ::)
  // and we connect via 127.0.0.1 which always resolves locally.
  delete process.env.HOSTNAME;

  // Require inside try-catch so a broken server.js surfaces a real error message
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require(serverScript);
  } catch (err) {
    throw new Error(
      `Failed to load Next.js server: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  await waitForPort(port);
  serverPort = port;
  return port;
}
