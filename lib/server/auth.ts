/**
 * Admin authentication.
 *
 * Passwords are hashed with Node's built-in scrypt (no native dependency, so it
 * behaves identically on cPanel shared hosting and on a VPS). Sessions are
 * stateless HMAC-signed cookies, which means no session table to keep in sync
 * across a multi-process Passenger/FPM deployment.
 */

import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHmac } from 'node:crypto';
import { cookies } from 'next/headers';
import { execute, isDatabaseConfigured, readFallback, sql, writeFallback } from './db';

const COOKIE = 'mk_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
}

/* ----------------------------- Passwords ----------------------------- */

const scrypt = (password: string, salt: string, keylen = 64) =>
  new Promise<Buffer>((resolve, reject) => {
    _scrypt(password.normalize('NFKC'), salt, keylen, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });

/** Stores `scrypt$<salt>$<hash>`; the plaintext is never written anywhere. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const key = await scrypt(password, salt);
  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== key.length) return false;
  return timingSafeEqual(key, expected);
}

/* ------------------------------ Sessions ----------------------------- */

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  // In production a weak/absent secret must not silently allow anyone in.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters.');
  }
  return 'mkurugenzi-development-secret-do-not-use-in-production';
}

/**
 * Whether a usable session secret is configured. Lets the login route return an
 * actionable message instead of a generic 500 when a host is misconfigured.
 */
export function isSessionConfigured() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return true;
  return process.env.NODE_ENV !== 'production';
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export async function createSession(user: AdminUser) {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${user.id}.${user.role}.${expires}`;
  const token = `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
  return { token, expires };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}

export const SESSION_COOKIE = COOKIE;

/** Verifies the cookie signature and expiry. Returns the user payload or null. */
export async function getSessionUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const [encoded, mac] = token.split('.');
  if (!encoded || !mac) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [id, role, expires] = payload.split('.');
  if (!id || !Number(expires) || Number(expires) < Date.now()) return null;

  return { id, role, email: '', name: '' };
}

/* -------------------------------- Users ------------------------------ */

interface FallbackUsers {
  users: { id: string; email: string; name: string; role: string; password_hash: string }[];
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const normalised = email.trim().toLowerCase();

  if (isDatabaseConfigured) {
    const rows = await sql<UserRow>(
      'SELECT * FROM `users` WHERE LOWER(`email`) = ? LIMIT 1',
      [normalised],
    );
    return rows[0] ?? null;
  }

  const store = await readFallback<FallbackUsers>('users', { users: [] });
  return store.users.find((u) => u.email.toLowerCase() === normalised) ?? null;
}

export async function saveUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
}) {
  const normalised = { ...user, email: user.email.trim().toLowerCase() };

  if (isDatabaseConfigured) {
    await execute(
      `INSERT INTO \`users\` (id, email, name, role, password_hash)
       VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         email = VALUES(email), name = VALUES(name), role = VALUES(role),
         password_hash = VALUES(password_hash)`,
      [normalised.id, normalised.email, normalised.name, normalised.role, normalised.password_hash],
    );
    return normalised;
  }

  const store = await readFallback<FallbackUsers>('users', { users: [] });
  const i = store.users.findIndex((u) => u.id === normalised.id);
  if (i === -1) store.users.push(normalised);
  else store.users[i] = normalised;
  await writeFallback('users', store);
  return normalised;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  if (isDatabaseConfigured) {
    const rows = await sql<UserRow>('SELECT * FROM `users` WHERE `id` = ? LIMIT 1', [id]);
    return rows[0] ?? null;
  }
  const store = await readFallback<FallbackUsers>('users', { users: [] });
  return store.users.find((u) => u.id === id) ?? null;
}

/** Removes an account. Used when a member of staff leaves. */
export async function deleteUser(id: string): Promise<void> {
  if (isDatabaseConfigured) {
    await execute('DELETE FROM `users` WHERE `id` = ?', [id]);
    return;
  }
  const store = await readFallback<FallbackUsers>('users', { users: [] });
  store.users = store.users.filter((u) => u.id !== id);
  await writeFallback('users', store);
}

export async function listUsers(): Promise<AdminUser[]> {
  if (isDatabaseConfigured) {
    const rows = await sql<Omit<UserRow, 'password_hash'>>(
      'SELECT id, email, name, role FROM `users` ORDER BY `created_at` ASC',
    );
    return rows;
  }
  const store = await readFallback<FallbackUsers>('users', { users: [] });
  return store.users.map(({ id, email, name, role }) => ({ id, email, name, role }));
}

export async function authenticate(email: string, password: string): Promise<AdminUser | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    // Burn a comparable amount of time so a missing account is not detectable by timing.
    await scrypt(password, 'timing-equaliser');
    return null;
  }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
