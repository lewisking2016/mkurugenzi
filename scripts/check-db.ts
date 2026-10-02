/**
 * Verifies the database connection and reports what is already in it.
 *
 *   npm run db:check
 *
 * Useful right after configuring cPanel credentials, before running db:setup.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = await readFile(path.join(root, file), 'utf8');
      for (const line of raw.split('\n')) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (!match) continue;
        const [, key, value] = match;
        if (process.env[key] === undefined) {
          process.env[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // Fall back to the ambient environment.
    }
  }
}

async function main() {
  await loadEnv();
  const { DB_HOST, DB_NAME, DB_USER } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.log(
      '\n  No database configured — the app will use the local file store in .data/.\n' +
        '  Set DB_HOST / DB_USER / DB_PASSWORD / DB_NAME to switch to MySQL.\n',
    );
    process.exit(0);
  }

  const { sql, closePool, isDatabaseConfigured } = await import('../lib/server/db');

  try {
    const rows = await sql<{ db: string; user: string; version: string }>('SELECT DATABASE() AS db, USER() AS user, VERSION() AS version');
    console.log(`\n  Connected to ${DB_HOST} as ${DB_USER}`);
    console.log(`  Database: ${rows[0]?.db}`);
    console.log(`  Server:   ${rows[0]?.version}\n`);

    const tables = ['products', 'promos', 'clients', 'deliveries', 'settings', 'users'];
    for (const table of tables) {
      try {
        const [{ count }] = await sql<{ count: number }>(`SELECT COUNT(*) AS count FROM \`${table}\``);
        console.log(`  ${table.padEnd(12)} ${count} rows`);
      } catch {
        console.log(`  ${table.padEnd(12)} (missing — run npm run db:setup)`);
      }
    }
    console.log('');
  } catch (error) {
    console.error('\n  Connection failed:', error instanceof Error ? error.message : error, '\n');
    process.exitCode = 1;
  } finally {
    if (isDatabaseConfigured) await closePool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
