/**
 * Production readiness check.
 *
 *   npm run preflight
 *
 * Run this on the server before pointing a domain at the app. It checks the
 * things that are easy to get wrong and hard to notice later: a missing
 * database, a weak or example session secret, the installer password still in
 * place, an unwritable uploads folder, and columns that `db:setup` has not
 * added yet.
 *
 * It only reads. Nothing is created, changed or deleted.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

type Level = 'pass' | 'warn' | 'fail';
interface Check {
  level: Level;
  name: string;
  detail: string;
}

const checks: Check[] = [];
const add = (level: Level, name: string, detail: string) => checks.push({ level, name, detail });

const INSECURE_SECRETS = new Set([
  'replace-this-with-a-long-random-string-at-least-32-chars',
  'mkurugenzi-development-secret-do-not-use-in-production',
]);
const INSECURE_DEFAULT_PASSWORD = 'mkurugenzi-admin';

/** Loads .env.local / .env the same way the other scripts do. */
async function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = await fs.readFile(path.join(root, file), 'utf8');
      for (const line of raw.split('\n')) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (!match) continue;
        const [, key, value] = match;
        if (process.env[key] === undefined) {
          process.env[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // No such file — rely on the ambient environment.
    }
  }
}

function checkEnvironment() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  // Next 15 needs 18.18+; cPanel apps older than this will fail to boot.
  if (nodeMajor >= 20) add('pass', 'Node version', `v${process.versions.node}`);
  else if (nodeMajor === 18) add('warn', 'Node version', `v${process.versions.node} — Node 20 is recommended`);
  else add('fail', 'Node version', `v${process.versions.node} is too old, Next 15 needs 18.18+`);
}

function checkDatabaseConfig() {
  const { DB_HOST, DB_USER, DB_NAME, DB_PASSWORD } = process.env;
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    add(
      'fail',
      'Database configured',
      'DB_HOST / DB_USER / DB_NAME are missing. Production will refuse every query rather than fall back to a file.',
    );
    return;
  }
  add('pass', 'Database configured', `${DB_USER}@${DB_HOST}/${DB_NAME}`);
  if (!DB_PASSWORD) add('warn', 'Database password', 'DB_PASSWORD is empty');
}

function checkSessionSecret() {
  const secret = process.env.SESSION_SECRET ?? '';
  if (!secret) {
    add('fail', 'SESSION_SECRET', 'Not set. The app will throw on boot in production.');
  } else if (secret.length < 32) {
    add('fail', 'SESSION_SECRET', `Only ${secret.length} characters — at least 32 are required.`);
  } else if (INSECURE_SECRETS.has(secret)) {
    add('fail', 'SESSION_SECRET', 'Still the example value from .env.example.');
  } else {
    add('pass', 'SESSION_SECRET', `${secret.length} characters, not the example value`);
  }
}

async function checkAdminAccount() {
  const { findUserByEmail, verifyPassword } = await import('../lib/server/auth');
  const { isDatabaseConfigured } = await import('../lib/server/db');

  const email = (process.env.ADMIN_EMAIL || 'admin@mkurugenzi.co.ke').trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user) {
    add('fail', 'Admin account', `No account for ${email}. Run: npm run db:setup`);
    return;
  }

  // Only worth checking the seeded password when it is actually still in use.
  if (await verifyPassword(INSECURE_DEFAULT_PASSWORD, user.password_hash)) {
    add(
      'fail',
      'Admin password',
      `Still the installer default. Change it from /mkuruadmin → Account & staff.`,
    );
  } else {
    add('pass', 'Admin password', 'No longer the installer default');
  }
}

async function checkUploads() {
  const dir = path.join(root, 'uploads');
  try {
    const stat = await fs.stat(dir);
    if (!stat.isDirectory()) {
      add('fail', 'uploads folder', 'uploads exists but is not a directory');
      return;
    }
  } catch {
    add('fail', 'uploads folder', 'Missing. Create it: mkdir -p uploads');
    return;
  }

  // The real test is whether the app user can write, which is what uploading needs.
  const probe = path.join(dir, `.preflight-${process.pid}`);
  try {
    await fs.writeFile(probe, 'ok');
    await fs.unlink(probe);
    add('pass', 'uploads folder', 'Present and writable');
  } catch (error) {
    add(
      'fail',
      'uploads folder',
      `Not writable by the app user (${error instanceof Error ? error.message : error}). Try: chmod -R 775 uploads`,
    );
  }
}

async function checkSchema() {
  const { isDatabaseConfigured, sql } = await import('../lib/server/db');
  if (!isDatabaseConfigured) {
    add('fail', 'Schema', 'No database configured, cannot verify tables');
    return;
  }

  try {
    const required: [string, string[]][] = [
      ['products', ['size_stock']],
      ['deliveries', ['source', 'county', 'email', 'phone', 'notes', 'mpesa_receipt']],
    ];
    for (const [table, columns] of required) {
      const rows = await sql<{ COLUMN_NAME: string }>(
        'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
        [table],
      );
      if (rows.length === 0) {
        add('fail', 'Schema', `Table \`${table}\` is missing. Run: npm run db:setup`);
        continue;
      }
      const present = new Set(rows.map((r) => r.COLUMN_NAME));
      const missing = columns.filter((c) => !present.has(c));
      if (missing.length > 0) {
        add('fail', 'Schema', `\`${table}\` is missing ${missing.join(', ')}. Run: npm run db:setup`);
      } else {
        add('pass', 'Schema', `\`${table}\` has all expected columns`);
      }
    }
  } catch (error) {
    add('fail', 'Schema', `Could not read information_schema: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  await loadEnv();

  checkEnvironment();
  checkDatabaseConfig();
  checkSessionSecret();
  await checkAdminAccount();
  await checkUploads();
  await checkSchema();

  const icon: Record<Level, string> = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' };
  console.log('\n  Mkurugenzi production preflight\n  ' + '-'.repeat(52));
  for (const check of checks) {
    console.log(`  [${icon[check.level]}] ${check.name.padEnd(18)} ${check.detail}`);
  }
  console.log('  ' + '-'.repeat(52));

  const failures = checks.filter((c) => c.level === 'fail');
  const warnings = checks.filter((c) => c.level === 'warn');

  if (failures.length > 0) {
    console.log(`\n  ${failures.length} problem(s) must be fixed before going live.\n`);
    process.exit(1);
  }
  if (warnings.length > 0) {
    console.log(`\n  Ready, with ${warnings.length} warning(s) worth reading.\n`);
  } else {
    console.log('\n  All checks passed — ready to go live.\n');
  }
}

main().catch((error) => {
  console.error('\n  Preflight failed to run:', error instanceof Error ? error.message : error, '\n');
  process.exit(1);
});
