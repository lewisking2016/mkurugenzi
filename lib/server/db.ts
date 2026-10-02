/**
 * MySQL/MariaDB access layer.
 *
 * - On cPanel or a VPS you set DB_HOST / DB_USER / DB_PASSWORD / DB_NAME and this
 *   module talks to a real server database.
 * - During local development no database is usually running, so we fall back to a
 *   JSON file under `.data/` to keep the dashboard usable. That fallback is never
 *   used in production: if DB_HOST is missing on a production build every query throws.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

export const isProd = process.env.NODE_ENV === 'production';

const hasDbConfig = Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);

/** True when a real database server is configured for this environment. */
export const isDatabaseConfigured = hasDbConfig;

/**
 * On production a missing DB_HOST is a misconfiguration we want to surface loudly
 * rather than silently degrading to the dev file store.
 */
function requireDb() {
  if (!isDatabaseConfigured) {
    throw new Error(
      'Database is not configured. Set DB_HOST, DB_USER, DB_PASSWORD and DB_NAME (see .env.example).',
    );
  }
}

type Pool = import('mysql2/promise').Pool;
let pool: Pool | null = null;

async function getPool(): Promise<Pool> {
  if (!pool) {
    requireDb();
    const mysql = await import('mysql2/promise');
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_LIMIT || 5),
      charset: 'utf8mb4_unicode_ci',
      // cPanel shared hosting often has no TLS certificate we control.
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      dateStrings: true,
      supportBigNumbers: true,
    });
  }
  return pool;
}

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const p = await getPool();
  const [rows] = await p.query(text, params);
  return rows as T[];
}

export async function execute(
  text: string,
  params: unknown[] = [],
): Promise<{ affectedRows: number; insertId: number }> {
  const p = await getPool();
  const [res] = await p.query(text, params);
  const r = res as { affectedRows?: number; insertId?: number };
  return { affectedRows: r.affectedRows ?? 0, insertId: r.insertId ?? 0 };
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

type Connection = import('mysql2/promise').PoolConnection;

/**
 * A dedicated connection for multi-statement work that must be all-or-nothing
 * (order placement touching several rows, for example).
 */
export async function getConnection(): Promise<Connection> {
  const p = await getPool();
  return p.getConnection();
}

/* ------------------------------------------------------------------ *
 * Development fallback store
 * ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), '.data');

/**
 * Each fallback store gets its own file — sharing one file between the catalogue
 * and the user table would let one write clobber the other.
 * `ADMIN_STORE_FILE` overrides the location for tests and tooling.
 */
export function fallbackFile(name: string) {
  const configured = process.env.ADMIN_STORE_FILE;
  const dir = configured ? path.dirname(path.resolve(process.cwd(), configured)) : DATA_DIR;
  const base = configured ? path.basename(configured, '.json') : '';
  return path.join(dir, `${base ? `${base}-` : ''}${name}.json`);
}

export async function readFallback<T>(name: string, fallback: T): Promise<T> {
  if (isDatabaseConfigured) return fallback;
  try {
    const raw = await fs.readFile(fallbackFile(name), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeFallback(name: string, data: unknown) {
  if (isDatabaseConfigured) return;
  const file = fallbackFile(name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}
