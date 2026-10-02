import { NextResponse } from 'next/server';
import {
  authenticate, createSession, isSessionConfigured, SESSION_COOKIE, sessionCookieOptions,
} from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Small in-memory throttle so a shared cPanel box is not brute-forced via this route. */
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function throttled(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.until < now) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function record(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.until < now) {
    attempts.set(key, { count: 1, until: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export async function POST(request: Request) {
  // A host without SESSION_SECRET cannot issue trustworthy cookies — say so plainly.
  if (!isSessionConfigured()) {
    return NextResponse.json(
      {
        error:
          'Admin sign-in is not configured on this server. Set SESSION_SECRET to a random string of at least 32 characters (openssl rand -hex 32).',
      },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (throttled(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in a few minutes.' },
      { status: 429 },
    );
  }

  let email = '';
  let password = '';
  try {
    const body = await request.json();
    email = String(body?.email ?? '');
    password = String(body?.password ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await authenticate(email, password);
  if (!user) {
    record(ip);
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  const { token } = await createSession(user);
  const response = NextResponse.json({ user: { email: user.email, name: user.name, role: user.role } });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
