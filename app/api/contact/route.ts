import { NextResponse } from 'next/server';
import { saveMessage } from '@/lib/server/repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public endpoint behind the contact form on /contact.
 *
 * Anyone on the internet can post here, so every field is trimmed, length
 * capped, rate limited per IP and screened with a honeypot before the message
 * reaches the inbox. Nothing is rendered as HTML anywhere, so storing the raw
 * text is safe — React escapes it on the way out.
 */

const LIMITS = { name: 120, contact: 160, subject: 160, body: 4000 } as const;

/** Hidden input real people never fill in; bots tend to complete everything. */
const HONEYPOT_FIELD = 'website';

const submissions = new Map<string, { count: number; until: number }>();
const MAX_SUBMISSIONS = 5;
const WINDOW_MS = 10 * 60 * 1000;

function throttled(key: string) {
  const entry = submissions.get(key);
  return Boolean(entry && entry.until > Date.now() && entry.count >= MAX_SUBMISSIONS);
}

function record(key: string) {
  const now = Date.now();
  const entry = submissions.get(key);
  if (!entry || entry.until < now) submissions.set(key, { count: 1, until: now + WINDOW_MS });
  else entry.count += 1;
}

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (throttled(ip)) {
    return NextResponse.json(
      { error: 'Too many messages sent. Please try again in a few minutes.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Silently accept spam so the bot does not learn it was caught.
  if (clean(body[HONEYPOT_FIELD], 200)) return NextResponse.json({ ok: true });

  const message = {
    name: clean(body.name, LIMITS.name),
    contact: clean(body.contact, LIMITS.contact),
    subject: clean(body.subject, LIMITS.subject),
    body: clean(body.body, LIMITS.body),
  };

  if (!message.name || !message.contact || !message.body) {
    return NextResponse.json(
      { error: 'Please fill in your name, contact details and message.' },
      { status: 400 },
    );
  }

  try {
    await saveMessage({ ...message, status: 'new', createdAt: new Date().toISOString() });
    record(ip);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('[contact]', error);
    return NextResponse.json(
      { error: 'We could not save your message. Please WhatsApp us on +254 716 265 661.' },
      { status: 500 },
    );
  }
}
