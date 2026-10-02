/**
 * Creates the Mkurugenzi schema and seeds a fresh install.
 *
 *   npm run db:setup              # create tables + seed catalogue + create admin user
 *   npm run db:setup -- --force   # wipe existing rows first, then re-seed
 *
 * Requires DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (see .env.example).
 * ADMIN_EMAIL / ADMIN_PASSWORD create the first admin account.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const force = process.argv.includes('--force');

/** Loads .env.local then .env by hand so the script needs no dotenv dependency. */
async function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = await readFile(path.join(root, file), 'utf8');
      for (const line of raw.split('\n')) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key] === undefined) {
          process.env[key] = rawValue.replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // No such file — rely on the ambient environment.
    }
  }
}

/** Splits the schema file into individual statements. */
function statements(sqlText: string) {
  return sqlText
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));
}

/**
 * The password `db:setup` falls back to. It exists so a developer can get
 * running with one command, and it is refused outright in production.
 */
const INSECURE_DEFAULT_PASSWORD = 'mkurugenzi-admin';

/** Values that must never reach a live site. */
const INSECURE_SECRETS = new Set([
  'replace-this-with-a-long-random-string-at-least-32-chars',
  'mkurugenzi-development-secret-do-not-use-in-production',
]);

function assertProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') return;

  const problems: string[] = [];
  const sessionSecret = process.env.SESSION_SECRET ?? '';
  if (sessionSecret.length < 32) problems.push('SESSION_SECRET must be at least 32 characters.');
  else if (INSECURE_SECRETS.has(sessionSecret)) problems.push('SESSION_SECRET is still the example value.');

  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!password) problems.push('ADMIN_PASSWORD is not set.');
  else if (password === INSECURE_DEFAULT_PASSWORD) {
    problems.push(`ADMIN_PASSWORD is still the default "${INSECURE_DEFAULT_PASSWORD}".`);
  } else if (password.length < 12) problems.push('ADMIN_PASSWORD must be at least 12 characters.');

  if (problems.length > 0) {
    console.error('\n  Refusing to run in production with unsafe credentials:\n');
    for (const p of problems) console.error(`    - ${p}`);
    console.error('\n  Set SESSION_SECRET and ADMIN_PASSWORD in your host environment first.\n');
    process.exit(1);
  }
}

/**
 * Columns added after a table first shipped. Safe to re-run: each is skipped when
 * it is already present, so `db:setup` doubles as the migration step on deploy.
 */
const ADDITIVE_COLUMNS: [string, string, string][] = [
  ['products', 'size_stock', 'TEXT NULL'],
  ['deliveries', 'source', "VARCHAR(16) NOT NULL DEFAULT 'manual'"],
  ['deliveries', 'county', 'VARCHAR(64) NOT NULL DEFAULT \'\''],
  ['deliveries', 'email', "VARCHAR(191) NOT NULL DEFAULT ''"],
  ['deliveries', 'phone', "VARCHAR(64) NOT NULL DEFAULT ''"],
  ['deliveries', 'notes', 'TEXT NULL'],
  ['deliveries', 'mpesa_receipt', "VARCHAR(64) NOT NULL DEFAULT ''"],
];

/** Dev-only bootstrap: writes the seed catalogue and an admin user to .data/. */
async function seedLocalStore() {
  const repo = await import('../lib/server/repo');
  const { hashPassword, saveUser } = await import('../lib/server/auth');
  const seeds = await import('../lib/seed');

  if (force) {
    const { fallbackFile } = await import('../lib/server/db');
    const { rm } = await import('node:fs/promises');
    await rm(fallbackFile('store'), { force: true });
    await rm(fallbackFile('users'), { force: true });
    console.log('  Local store cleared (--force)');
  }

  const products = seeds.seedProducts();
  for (const p of products) await repo.saveProduct(p);
  console.log(`  Seeded ${products.length} products`);

  const clients = seeds.seedClients();
  for (const c of clients) await repo.saveClient(c);
  console.log(`  Seeded ${clients.length} clients`);

  const deliveries = seeds.seedDeliveries();
  for (const d of deliveries) await repo.saveDelivery(d);
  console.log(`  Seeded ${deliveries.length} deliveries`);

  const promos = seeds.seedPromos();
  for (const p of promos) await repo.savePromo(p);
  console.log(`  Seeded ${promos.length} promotions`);

  const messages = seeds.seedMessages();
  for (const m of messages) await repo.saveMessage(m);
  console.log(`  Seeded ${messages.length} contact messages`);

  await repo.saveSettings(seeds.seedSettings());
  console.log('  Seeded settings');

  const email = process.env.ADMIN_EMAIL || 'admin@mkurugenzi.co.ke';
  const password = process.env.ADMIN_PASSWORD || 'mkurugenzi-admin';
  await saveUser({
    id: 'u_admin',
    email: email.trim().toLowerCase(),
    name: process.env.ADMIN_NAME || 'Admin',
    role: 'admin',
    password_hash: await hashPassword(password),
  });
  console.log(`  Admin account ready — ${email} / ${password}\n`);
}

async function main() {
  await loadEnv();
  assertProductionSecrets();

  const { DB_HOST, DB_USER, DB_NAME } = process.env;
  const hasDb = Boolean(DB_HOST && DB_USER && DB_NAME);

  if (!hasDb) {
    console.log(
      '\n  No DB_HOST configured — seeding the local development store in .data/ instead.\n' +
        '  Set DB_HOST / DB_USER / DB_PASSWORD / DB_NAME in .env.local for a real database.\n',
    );
    await seedLocalStore();
    return;
  }

  console.log(`\n  Connecting to ${DB_HOST} / ${DB_NAME}`);

  const { execute, sql, closePool } = await import('../lib/server/db');
  const repo = await import('../lib/server/repo');
  const { hashPassword, saveUser } = await import('../lib/server/auth');
  const seeds = await import('../lib/seed');

  const schema = await readFile(path.join(root, 'lib/server/schema.sql'), 'utf8');
  for (const statement of statements(schema)) {
    await execute(statement);
  }
  console.log('  Tables ready');

  // `CREATE TABLE IF NOT EXISTS` leaves an already-deployed table untouched, so new
  // columns have to be added explicitly or an existing install never picks them up.
  for (const [table, column, definition] of ADDITIVE_COLUMNS) {
    const existing = await sql<{ COLUMN_NAME: string }>(
      'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [table, column],
    );
    if (existing.length === 0) {
      await execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`  Added ${table}.${column}`);
    }
  }

  if (force) {
    await execute('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['deliveries', 'products', 'promos', 'clients', 'messages', 'settings']) {
      await execute(`TRUNCATE TABLE \`${table}\``);
    }
    await execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('  Existing rows cleared (--force)');
  }

  const products = seeds.seedProducts();
  for (const p of products) await repo.saveProduct(p);
  console.log(`  Seeded ${products.length} products`);

  const clients = seeds.seedClients();
  for (const c of clients) await repo.saveClient(c);
  console.log(`  Seeded ${clients.length} clients`);

  const deliveries = seeds.seedDeliveries();
  for (const d of deliveries) await repo.saveDelivery(d);
  console.log(`  Seeded ${deliveries.length} deliveries`);

  const promos = seeds.seedPromos();
  for (const p of promos) await repo.savePromo(p);
  console.log(`  Seeded ${promos.length} promotions`);

  const messages = seeds.seedMessages();
  for (const m of messages) await repo.saveMessage(m);
  console.log(`  Seeded ${messages.length} contact messages`);

  await repo.saveSettings(seeds.seedSettings());
  console.log('  Seeded settings');

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    await saveUser({
      id: 'u_admin',
      email: email.trim().toLowerCase(),
      name: process.env.ADMIN_NAME || 'Admin',
      role: 'admin',
      password_hash: await hashPassword(password),
    });
    console.log(`  Admin account ready for ${email}`);
  } else {
    console.log('  ADMIN_EMAIL / ADMIN_PASSWORD not set — no admin account created yet.');
  }

  await closePool();
  console.log('\n  Done.\n');
}

main().catch((error) => {
  console.error('\n  Setup failed:', error instanceof Error ? error.message : error, '\n');
  process.exit(1);
});
