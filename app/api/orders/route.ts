import { NextResponse } from 'next/server';
import {
  decrementStock, getProduct, getSettings, listClients, listDeliveries, nextOrderReference,
  saveClient, saveDelivery, type StockRequest,
} from '@/lib/server/repo';
import { availableSizes, sizeAvailability } from '@/lib/types';
import type { Client, Delivery, DeliveryItem, PaymentMethod } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public endpoint behind the checkout form on /checkout.
 *
 * The browser sends only `{ productId, size, qty }` per line. Prices, names and
 * stock are all read back from the database here — a payload that claims a hoodie
 * costs KES 1 is simply priced at whatever the catalogue says. Stock is then
 * decremented in a transaction, and only if that succeeds is the order written.
 *
 * Because this is unauthenticated it is rate limited per IP, length capped and
 * honeypot screened, the same way /api/contact is.
 */

const LIMITS = {
  name: 120,
  phone: 40,
  email: 160,
  county: 64,
  town: 120,
  address: 255,
  notes: 1000,
} as const;

const MAX_LINES = 25;
const MAX_QTY_PER_LINE = 10;
const HONEYPOT_FIELD = 'website';
const PAYMENTS: PaymentMethod[] = ['mpesa', 'cod', 'paypal', 'card'];

const orders = new Map<string, { count: number; until: number }>();
const MAX_ORDERS = 12;
const WINDOW_MS = 10 * 60 * 1000;

function throttled(key: string) {
  const entry = orders.get(key);
  return Boolean(entry && entry.until > Date.now() && entry.count >= MAX_ORDERS);
}

function record(key: string) {
  const now = Date.now();
  const entry = orders.get(key);
  if (!entry || entry.until < now) orders.set(key, { count: 1, until: now + WINDOW_MS });
  else entry.count += 1;
}

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

interface IncomingLine {
  productId?: unknown;
  size?: unknown;
  qty?: unknown;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (throttled(ip)) {
    return NextResponse.json(
      { error: 'Too many orders from this connection. Please try again shortly.' },
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

  const customer = {
    name: clean(body.name, LIMITS.name),
    phone: clean(body.phone, LIMITS.phone),
    email: clean(body.email, LIMITS.email),
    county: clean(body.county, LIMITS.county),
    town: clean(body.town, LIMITS.town),
    address: clean(body.address, LIMITS.address),
    notes: clean(body.notes, LIMITS.notes),
  };

  if (!customer.name || !customer.phone || !customer.address) {
    return NextResponse.json(
      { error: 'Please give us your name, phone number and delivery address.' },
      { status: 400 },
    );
  }

  const payment = PAYMENTS.includes(body.payment as PaymentMethod)
    ? (body.payment as PaymentMethod)
    : 'mpesa';

  const rawLines = Array.isArray(body.items) ? (body.items as IncomingLine[]) : [];
  if (rawLines.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  }
  if (rawLines.length > MAX_LINES) {
    return NextResponse.json({ error: 'Too many items in one order.' }, { status: 400 });
  }

  // ── Re-price every line from the catalogue ──────────────────────────────
  const items: DeliveryItem[] = [];
  const stockRequests: StockRequest[] = [];

  for (const line of rawLines) {
    const productId = clean(line.productId, 64);
    const size = clean(line.size, 32);
    const qty = Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.round(Number(line.qty) || 0)));

    if (!productId) {
      return NextResponse.json({ error: 'Your cart contains an unknown item.' }, { status: 400 });
    }

    const product = await getProduct(productId);
    if (!product || product.status !== 'active') {
      return NextResponse.json(
        { error: 'One of the items in your cart is no longer available.' },
        { status: 409 },
      );
    }

    const chosen = size || product.sizes[0] || 'One size';
    if (!product.sizes.includes(chosen)) {
      return NextResponse.json(
        { error: `${product.name} is not available in size ${chosen}.` },
        { status: 400 },
      );
    }

    const available = sizeAvailability(product, chosen);
    if (available <= 0) {
      return NextResponse.json(
        { error: `${product.name} has sold out in size ${chosen}.` },
        { status: 409 },
      );
    }
    if (qty > available) {
      return NextResponse.json(
        { error: `Only ${available} left of ${product.name} in size ${chosen}.` },
        { status: 409 },
      );
    }

    items.push({
      productId: product.id,
      name: product.name,
      size: chosen,
      qty,
      price: product.price,
    });
    stockRequests.push({ productId: product.id, size: chosen, qty });
  }

  // ── Delivery fee, from the settings the team actually configured ─────────
  const settings = await getSettings();
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const fee =
    subtotal > 0 && subtotal < settings.freeDeliveryThreshold
      ? customer.county.toLowerCase() === 'nairobi'
        ? settings.deliveryFeeNairobi
        : settings.deliveryFeeOutside
      : 0;
  const total = subtotal + fee;

  // ── Reserve the stock ───────────────────────────────────────────────────
  const stock = await decrementStock(stockRequests);
  if (!stock.ok) {
    // `in` rather than a discriminated check: this project compiles with
    // strictNullChecks off, which disables narrowing on literal types.
    return NextResponse.json({ error: 'reason' in stock ? stock.reason : 'Out of stock' }, { status: 409 });
  }

  try {
    // Reuse the client's record when the same phone has ordered before, so the
    // CRM counters and tier keep building up instead of fragmenting.
    const existing = await listClients();
    const prior = existing.find(
      (c) => c.phone && customer.phone && c.phone.replace(/\s/g, '') === customer.phone.replace(/\s/g, ''),
    );

    let clientId = prior?.id ?? null;
    if (prior) {
      const updated: Client = {
        ...prior,
        name: customer.name || prior.name,
        email: customer.email || prior.email,
        orders: prior.orders + 1,
        spent: prior.spent + total,
        tier: prior.tier === 'new' ? 'regular' : prior.tier,
      };
      await saveClient(updated);
      clientId = prior.id;
    } else {
      const created: Client = {
        id: `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        city: customer.town,
        orders: 1,
        spent: total,
        tier: 'new',
        joinedAt: new Date().toISOString().slice(0, 10),
        notes: '',
      };
      await saveClient(created);
      clientId = created.id;
    }

    const reference = nextOrderReference(await listDeliveries());
    const order: Delivery = {
      id: `d_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      reference,
      clientId,
      clientName: customer.name,
      items,
      total,
      // Cash on delivery is paid up front; everything else waits for the team to
      // confirm the M-Pesa / PayPal / card transfer landed.
      status: payment === 'cod' ? 'confirmed' : 'awaiting_payment',
      payment,
      courier: '',
      tracking: '',
      address: [customer.address, customer.town, customer.county].filter(Boolean).join(', '),
      placedAt: new Date().toISOString().slice(0, 10),
      window: 'To be arranged',
      source: 'web',
      county: customer.county,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
      mpesaReceipt: '',
    };
    await saveDelivery(order);

    record(ip);
    return NextResponse.json(
      { ok: true, reference, total, subtotal, deliveryFee: fee, status: order.status },
      { status: 201 },
    );
  } catch (error) {
    console.error('[orders]', error);
    return NextResponse.json(
      {
        error:
          'We could not save your order. Please WhatsApp us on +254 716 265 661 and we will sort it out.',
      },
      { status: 500 },
    );
  }
}

/** GET /api/orders?productId=3 — live per-size availability for the product page. */
export async function GET(request: Request) {
  try {
    const productId = new URL(request.url).searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    const product = await getProduct(productId);
    if (!product) return NextResponse.json({ error: 'No such product' }, { status: 404 });
    return NextResponse.json({
      productId: product.id,
      sizeStock: product.sizeStock ?? {},
      availableSizes: availableSizes(product),
    });
  } catch (error) {
    console.error('[orders]', error);
    return NextResponse.json({ error: 'Could not load availability' }, { status: 500 });
  }
}
