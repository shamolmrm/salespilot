import { NextResponse } from 'next/server';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Called by Electron on first startup to create tables + seed admin user.
// Safe to call multiple times — skips objects that already exist.
export async function POST() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: 'DATABASE_URL is not set in .env' }, { status: 500 });
  }

  const client = new Client({ connectionString: url });

  try {
    await client.connect();

    // Locate schema.sql — bundled at resources/prisma/schema.sql in prod, or cwd in dev
    // process.resourcesPath is set by Electron (not in Node.js types — cast to any)
    const resourcesPath: string | undefined = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
    const candidates = [
      resourcesPath && path.join(resourcesPath, 'prisma', 'schema.sql'),
      path.join(process.cwd(), 'prisma', 'schema.sql'),
    ].filter(Boolean) as string[];

    let sql = '';
    for (const p of candidates) {
      if (fs.existsSync(p)) { sql = fs.readFileSync(p, 'utf8'); break; }
    }

    if (!sql) {
      return NextResponse.json({ error: 'schema.sql not found — cannot auto-create tables' }, { status: 500 });
    }

    let created = 0;
    let skipped = 0;

    for (const stmt of splitSql(sql)) {
      if (!stmt.trim()) continue;
      try {
        await client.query(stmt);
        created++;
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        // 42P07 = table exists, 42710 = type exists, 42701 = column exists, 42P06 = schema exists
        if (['42P07', '42710', '42701', '42P06', '42P16'].includes(code ?? '') ||
            String((e as Error).message).includes('already exists')) {
          skipped++;
        } else {
          throw e;
        }
      }
    }

    // Seed default admin if no users exist
    const { rows } = await client.query<{ id: string }>('SELECT id FROM "User" LIMIT 1');
    let seeded = false;
    if (rows.length === 0) {
      const hash = await bcrypt.hash('Admin@123', 12);
      const id = crypto.randomUUID();
      await client.query(
        `INSERT INTO "User" (id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'ADMIN', true, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        [id, 'admin@salespilot.local', 'System Admin', hash],
      );
      seeded = true;
    }

    return NextResponse.json({ ok: true, created, skipped, seeded });
  } catch (err) {
    console.error('[setup] error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  } finally {
    await client.end().catch(() => {});
  }
}

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ ready: false, reason: 'DATABASE_URL not set' });

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'User'
       ) AS exists`,
    );
    const tablesExist = rows[0]?.exists ?? false;
    let adminExists = false;
    if (tablesExist) {
      const r = await client.query('SELECT id FROM "User" WHERE email = $1 LIMIT 1', ['admin@salespilot.local']);
      adminExists = r.rows.length > 0;
    }
    return NextResponse.json({ ready: tablesExist && adminExists, tablesExist, adminExists });
  } catch (e) {
    return NextResponse.json({ ready: false, reason: (e as Error).message });
  } finally {
    await client.end().catch(() => {});
  }
}

// Splits a PostgreSQL SQL script into individual statements, respecting
// dollar-quoted strings (which can contain semicolons).
function splitSql(sql: string): string[] {
  const stmts: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    if (!inDollarQuote && sql[i] === '$') {
      const end = sql.indexOf('$', i + 1);
      if (end !== -1) {
        const tag = sql.slice(i, end + 1);
        inDollarQuote = true;
        dollarTag = tag;
        current += tag;
        i = end + 1;
        continue;
      }
    } else if (inDollarQuote && sql.startsWith(dollarTag, i)) {
      current += dollarTag;
      i += dollarTag.length;
      inDollarQuote = false;
      dollarTag = '';
      continue;
    }

    if (!inDollarQuote && sql[i] === ';') {
      const s = current.trim();
      if (s) stmts.push(s);
      current = '';
    } else {
      current += sql[i];
    }
    i++;
  }

  const last = current.trim();
  if (last) stmts.push(last);
  return stmts;
}
