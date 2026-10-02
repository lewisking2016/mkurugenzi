/**
 * Typed repository over MySQL/MariaDB.
 *
 * Every function has two implementations behind one signature:
 *  - MySQL (cPanel / VPS) when DB_HOST is configured;
 *  - a JSON file under `.data/` so `npm run dev` works with no database running.
 *
 * The admin UI talks to this through API routes, never to the database directly.
 */

import { execute, getConnection, isDatabaseConfigured, readFallback, sql, writeFallback } from './db';
import { sizeAvailability, slugify, seedClients, seedDeliveries, seedMessages, seedProducts, seedPromos, seedSettings } from '../seed';
import type {
  Client, Delivery, DeliveryStatus, DeliveryItem, Message, MessageStatus, OrderSource, PaymentMethod,
  Product, ProductStatus, Promo, PromoType, SystemSettings,
} from '../types';

interface Store {
  products: Product[];
  promos: Promo[];
  clients: Client[];
  deliveries: Delivery[];
  messages: Message[];
  settings: SystemSettings;
}

const blankStore = (): Store => ({
  products: seedProducts(),
  promos: seedPromos(),
  clients: seedClients(),
  deliveries: seedDeliveries(),
  messages: seedMessages(),
  settings: seedSettings(),
});

const loadStore = async () => {
  const store = await readFallback<Store>('store', blankStore());
  // A store.json written before messages existed must not break the whole file.
  if (!Array.isArray(store.messages)) store.messages = [];
  return store;
};

/** A short, human-quotable order number like `MK-4821`. */
export function nextOrderReference(existing: { reference: string }[]): string {
  const used = new Set(
    existing.map((d) => Number(String(d.reference).replace(/\D/g, ''))).filter((n) => Number.isFinite(n) && n > 0),
  );
  // Start from the highest existing number so a deleted order never gets reused.
  let candidate = Math.max(1000, ...used) + 1;
  while (used.has(candidate)) candidate += 1;
  return `MK-${candidate}`;
}

async function saveStore(store: Store) {
  await writeFallback('store', store);
}

/** MySQL DATETIME/JSON columns can come back as buffers or strings depending on the driver build. */
function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

const asNumber = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const asBool = (v: unknown) => v === 1 || v === true || v === '1';

/**
 * MySQL returns DATETIME as `YYYY-MM-DD HH:MM:SS` with `dateStrings: true`.
 * Normalise both that and a real ISO string so the admin UI can parse both.
 */
function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2} /.test(trimmed)) {
      return `${trimmed.replace(' ', 'T')}${trimmed.length <= 19 ? 'Z' : ''}`;
    }
    return trimmed;
  }
  return new Date().toISOString();
}

/* ================================================================== *
 * Products
 * ================================================================== */

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: Product['category'];
  price: number;
  compare_price: number | null;
  stock: number;
  sold: number;
  sizes: unknown;
  size_stock: unknown;
  badge: string | null;
  status: ProductStatus;
  img: string;
  hover_img: string | null;
  description: string | null;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: asNumber(row.price),
    compareAtPrice: row.compare_price == null ? undefined : asNumber(row.compare_price),
    stock: asNumber(row.stock),
    sold: asNumber(row.sold),
    sizes: parseJson<string[]>(row.sizes, []),
    sizeStock: parseJson<Record<string, number> | undefined>(row.size_stock, undefined),
    badge: row.badge ?? undefined,
    status: row.status,
    img: row.img,
    hoverImg: row.hover_img ?? undefined,
    description: row.description ?? '',
  };
}

export async function listProducts(includeArchived = false): Promise<Product[]> {
  if (isDatabaseConfigured) {
    const rows = await sql<ProductRow>(
      includeArchived
        ? 'SELECT * FROM `products` ORDER BY `name` ASC'
        : "SELECT * FROM `products` WHERE `status` <> 'archived' ORDER BY `name` ASC",
    );
    return rows.map(toProduct);
  }
  const store = await loadStore();
  return includeArchived
    ? store.products
    : store.products.filter((p) => p.status !== 'archived');
}

export async function saveProduct(input: Product): Promise<Product> {
  const sizes = input.sizes ?? ['One size'];
  // Keep every declared size present in the map so the editor and the storefront
  // never disagree about which sizes exist.
  const sizeStock: Record<string, number> = {};
  for (const size of sizes) {
    const raw = input.sizeStock?.[size];
    sizeStock[size] = raw == null ? Math.max(0, Math.round(Number(input.stock) || 0)) : Math.max(0, Math.round(Number(raw) || 0));
  }

  const product: Product = {
    ...input,
    name: input.name ?? '',
    img: input.img ?? '',
    slug: input.slug?.trim() || slugify(input.name ?? ''),
    price: Math.max(0, Math.round(Number(input.price) || 0)),
    stock: Math.max(0, Math.round(Number(input.stock) || 0)),
    sold: Math.max(0, Math.round(Number(input.sold) || 0)),
    description: input.description ?? '',
    sizes,
    sizeStock,
  };

  if (isDatabaseConfigured) {
    await execute(
      `INSERT INTO \`products\`
         (id, slug, name, category, price, compare_price, stock, sold, sizes, size_stock, badge, status, img, hover_img, description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         slug = VALUES(slug), name = VALUES(name), category = VALUES(category),
         price = VALUES(price), compare_price = VALUES(compare_price), stock = VALUES(stock),
         sold = VALUES(sold), sizes = VALUES(sizes), size_stock = VALUES(size_stock), badge = VALUES(badge), status = VALUES(status),
         img = VALUES(img), hover_img = VALUES(hover_img), description = VALUES(description)`,
      [
        product.id, product.slug, product.name, product.category, product.price,
        product.compareAtPrice ?? null, product.stock, product.sold,
        JSON.stringify(product.sizes), JSON.stringify(product.sizeStock),
        product.badge ?? null, product.status,
        product.img, product.hoverImg ?? null, product.description,
      ],
    );
    return product;
  }

  const store = await loadStore();
  const i = store.products.findIndex((p) => p.id === product.id);
  if (i === -1) store.products.unshift(product);
  else store.products[i] = product;
  await saveStore(store);
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  if (isDatabaseConfigured) {
    await execute('DELETE FROM `products` WHERE `id` = ?', [id]);
    return;
  }
  const store = await loadStore();
  store.products = store.products.filter((p) => p.id !== id);
  await saveStore(store);
}

/** One size of one product, ready to be reserved. */
export interface StockRequest {
  productId: string;
  size: string;
  qty: number;
}

export type StockResult =
  | { ok: true; products: Product[] }
  | { ok: false; reason: string };

/**
 * Takes stock off a list of product/size pairs in one go.
 *
 * The MySQL path uses a conditional `UPDATE ... WHERE stock >= ?` per line and
 * rolls back the whole batch if any line comes back with zero affected rows, so two
 * shoppers racing for the last jacket cannot both win. The JSON path does the same
 * check-then-write against the in-memory store.
 */
export async function decrementStock(requests: StockRequest[]): Promise<StockResult> {
  if (requests.length === 0) return { ok: true, products: [] };

  if (isDatabaseConfigured) {
    const connection = await getConnection();
    const touched = new Map<string, Product>();
    try {
      await connection.beginTransaction();
      for (const req of requests) {
        // FOR UPDATE holds a row lock for the rest of the transaction, so a second
        // shopper checking out the same size waits instead of reading stale stock.
        const [rows] = await connection.query(
          'SELECT * FROM `products` WHERE `id` = ? LIMIT 1 FOR UPDATE',
          [req.productId],
        );
        const row = (rows as ProductRow[])[0];
        if (!row) throw new StockError('A product in this order no longer exists');

        const product = toProduct(row);
        if (sizeAvailability(product, req.size) < req.qty) {
          throw new StockError(`${product.name} (${req.size}) only has ${sizeAvailability(product, req.size)} left`);
        }

        if (product.sizeStock && product.sizeStock[req.size] != null) {
          const next = { ...product.sizeStock, [req.size]: product.sizeStock[req.size] - req.qty };
          await connection.query('UPDATE `products` SET `size_stock` = ? WHERE `id` = ?', [
            JSON.stringify(next),
            req.productId,
          ]);
          product.sizeStock = next;
        }
        await connection.query(
          'UPDATE `products` SET `stock` = ?, `sold` = `sold` + ? WHERE `id` = ?',
          [Math.max(0, product.stock - req.qty), req.qty, req.productId],
        );
        product.stock = Math.max(0, product.stock - req.qty);
        product.sold += req.qty;
        touched.set(product.id, product);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      if (error instanceof StockError) return { ok: false, reason: error.message };
      throw error;
    } finally {
      connection.release();
    }
    return { ok: true, products: [...touched.values()] };
  }

  const store = await loadStore();
  // Validate the whole basket before writing anything.
  for (const req of requests) {
    const product = store.products.find((p) => p.id === req.productId);
    if (!product) return { ok: false, reason: 'A product in this order no longer exists' };
    const available = sizeAvailability(product, req.size);
    if (available < req.qty) {
      return {
        ok: false,
        reason: `${product.name} (${req.size}) only has ${available} left`,
      };
    }
  }
  for (const req of requests) {
    const product = store.products.find((p) => p.id === req.productId)!;
    if (product.sizeStock && product.sizeStock[req.size] != null) {
      product.sizeStock[req.size] = Math.max(0, product.sizeStock[req.size] - req.qty);
    } else {
      product.stock = Math.max(0, product.stock - req.qty);
    }
    product.sold += req.qty;
  }
  await saveStore(store);
  return { ok: true, products: store.products.filter((p) => requests.some((r) => r.productId === p.id)) };
}

/** Puts stock back — used when an order is cancelled from the admin. */
export async function restoreStock(requests: StockRequest[]): Promise<void> {
  if (requests.length === 0) return;

  if (isDatabaseConfigured) {
    for (const req of requests) {
      const product = await getProduct(req.productId);
      if (!product) continue;
      if (product.sizeStock && product.sizeStock[req.size] != null) {
        const next = { ...product.sizeStock, [req.size]: product.sizeStock[req.size] + req.qty };
        await execute('UPDATE `products` SET `size_stock` = ?, `sold` = GREATEST(0, `sold` - ?) WHERE `id` = ?', [
          JSON.stringify(next),
          req.qty,
          req.productId,
        ]);
      } else {
        await execute('UPDATE `products` SET `stock` = `stock` + ?, `sold` = GREATEST(0, `sold` - ?) WHERE `id` = ?', [
          req.qty,
          req.qty,
          req.productId,
        ]);
      }
    }
    return;
  }

  const store = await loadStore();
  for (const req of requests) {
    const product = store.products.find((p) => p.id === req.productId);
    if (!product) continue;
    if (product.sizeStock && product.sizeStock[req.size] != null) {
      product.sizeStock[req.size] += req.qty;
    } else {
      product.stock += req.qty;
    }
    product.sold = Math.max(0, product.sold - req.qty);
  }
  await saveStore(store);
}

class StockError extends Error {}

/** A single product by id — used by checkout to price a line server-side. */
export async function getProduct(id: string): Promise<Product | undefined> {
  if (isDatabaseConfigured) {
    const rows = await sql<ProductRow>('SELECT * FROM `products` WHERE `id` = ? LIMIT 1', [id]);
    return rows[0] ? toProduct(rows[0]) : undefined;
  }
  const store = await loadStore();
  return store.products.find((p) => p.id === id);
}

/** A single delivery by id — used to detect a status change before saving. */
export async function getDelivery(id: string): Promise<Delivery | undefined> {
  if (isDatabaseConfigured) {
    const rows = await sql<DeliveryRow>('SELECT * FROM `deliveries` WHERE `id` = ? LIMIT 1', [id]);
    return rows[0] ? toDelivery(rows[0]) : undefined;
  }
  const store = await loadStore();
  return store.deliveries.find((d) => d.id === id);
}

/* ================================================================== *
 * Promotions
 * ================================================================== */

interface PromoRow {
  id: string;
  code: string;
  title: string;
  type: PromoType;
  value: number;
  starts_at: string | null;
  ends_at: string | null;
  used: number;
  limit_count: number;
  active: number;
}

function toPromo(row: PromoRow): Promo {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    type: row.type,
    value: asNumber(row.value),
    startsAt: row.starts_at ?? '',
    endsAt: row.ends_at ?? '',
    used: asNumber(row.used),
    limit: asNumber(row.limit_count),
    active: asBool(row.active),
  };
}

export async function listPromos(): Promise<Promo[]> {
  if (isDatabaseConfigured) {
    const rows = await sql<PromoRow>('SELECT * FROM `promos` ORDER BY `active` DESC, `code` ASC');
    return rows.map(toPromo);
  }
  const store = await loadStore();
  return store.promos;
}

export async function savePromo(input: Promo): Promise<Promo> {
  const promo: Promo = {
    ...input,
    code: (input.code ?? '').trim().toUpperCase(),
    title: input.title ?? '',
    startsAt: input.startsAt ?? '',
    endsAt: input.endsAt ?? '',
    value: Math.max(0, Math.round(Number(input.value) || 0)),
    used: Math.max(0, Math.round(Number(input.used) || 0)),
    limit: Math.max(0, Math.round(Number(input.limit) || 0)),
  };

  if (isDatabaseConfigured) {
    await execute(
      `INSERT INTO \`promos\` (id, code, title, type, value, starts_at, ends_at, used, limit_count, active)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         code = VALUES(code), title = VALUES(title), type = VALUES(type), value = VALUES(value),
         starts_at = VALUES(starts_at), ends_at = VALUES(ends_at), used = VALUES(used),
         limit_count = VALUES(limit_count), active = VALUES(active)`,
      [
        promo.id, promo.code, promo.title, promo.type, promo.value,
        promo.startsAt || null, promo.endsAt || null, promo.used, promo.limit,
        promo.active ? 1 : 0,
      ],
    );
    return promo;
  }

  const store = await loadStore();
  const i = store.promos.findIndex((p) => p.id === promo.id);
  if (i === -1) store.promos.unshift(promo);
  else store.promos[i] = promo;
  await saveStore(store);
  return promo;
}

export async function deletePromo(id: string): Promise<void> {
  if (isDatabaseConfigured) {
    await execute('DELETE FROM `promos` WHERE `id` = ?', [id]);
    return;
  }
  const store = await loadStore();
  store.promos = store.promos.filter((p) => p.id !== id);
  await saveStore(store);
}

/* ================================================================== *
 * Clients
 * ================================================================== */

interface ClientRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  orders: number;
  spent: number;
  tier: Client['tier'];
  joined_at: string | null;
  notes: string | null;
}

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? '',
    email: row.email ?? '',
    city: row.city ?? '',
    orders: asNumber(row.orders),
    spent: asNumber(row.spent),
    tier: row.tier,
    joinedAt: row.joined_at ?? '',
    notes: row.notes ?? '',
  };
}

export async function listClients(): Promise<Client[]> {
  if (isDatabaseConfigured) {
    const rows = await sql<ClientRow>('SELECT * FROM `clients` ORDER BY `spent` DESC');
    return rows.map(toClient);
  }
  const store = await loadStore();
  return [...store.clients].sort((a, b) => b.spent - a.spent);
}

export async function saveClient(input: Client): Promise<Client> {
  const client: Client = {
    ...input,
    name: input.name ?? '',
    phone: input.phone ?? '',
    email: input.email ?? '',
    city: input.city ?? '',
    joinedAt: input.joinedAt ?? '',
    orders: Math.max(0, Math.round(Number(input.orders) || 0)),
    spent: Math.max(0, Math.round(Number(input.spent) || 0)),
    notes: input.notes ?? '',
  };

  if (isDatabaseConfigured) {
    await execute(
      `INSERT INTO \`clients\` (id, name, phone, email, city, orders, spent, tier, joined_at, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), phone = VALUES(phone), email = VALUES(email), city = VALUES(city),
         orders = VALUES(orders), spent = VALUES(spent), tier = VALUES(tier),
         joined_at = VALUES(joined_at), notes = VALUES(notes)`,
      [
        client.id, client.name, client.phone, client.email, client.city,
        client.orders, client.spent, client.tier, client.joinedAt || null, client.notes,
      ],
    );
    return client;
  }

  const store = await loadStore();
  const i = store.clients.findIndex((c) => c.id === client.id);
  if (i === -1) store.clients.unshift(client);
  else store.clients[i] = client;
  await saveStore(store);
  return client;
}

export async function deleteClient(id: string): Promise<void> {
  if (isDatabaseConfigured) {
    await execute('DELETE FROM `clients` WHERE `id` = ?', [id]);
    return;
  }
  const store = await loadStore();
  store.clients = store.clients.filter((c) => c.id !== id);
  // Keep deliveries but detach them from the removed client.
  store.deliveries = store.deliveries.map((d) =>
    d.clientId === id ? { ...d, clientId: null } : d,
  );
  await saveStore(store);
}

/* ================================================================== *
 * Deliveries
 * ================================================================== */

interface DeliveryRow {
  id: string;
  reference: string;
  client_id: string | null;
  client_name: string;
  items: unknown;
  total: number;
  status: DeliveryStatus;
  payment: PaymentMethod;
  courier: string;
  tracking: string;
  address: string;
  placed_at: string | null;
  window: string;
  source: OrderSource;
  county: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  mpesa_receipt: string | null;
}

function toDelivery(row: DeliveryRow): Delivery {
  return {
    id: row.id,
    reference: row.reference,
    clientId: row.client_id,
    clientName: row.client_name ?? '',
    items: parseJson<DeliveryItem[]>(row.items, []),
    total: asNumber(row.total),
    status: row.status,
    payment: row.payment,
    courier: row.courier ?? '',
    tracking: row.tracking ?? '',
    address: row.address ?? '',
    placedAt: row.placed_at ?? '',
    window: row.window ?? '',
    source: row.source ?? 'manual',
    county: row.county ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    notes: row.notes ?? '',
    mpesaReceipt: row.mpesa_receipt ?? '',
  };
}

export async function listDeliveries(): Promise<Delivery[]> {
  if (isDatabaseConfigured) {
    const rows = await sql<DeliveryRow>(
      'SELECT * FROM `deliveries` ORDER BY `placed_at` DESC, `id` DESC',
    );
    return rows.map(toDelivery);
  }
  const store = await loadStore();
  return [...store.deliveries].sort((a, b) => (b.placedAt ?? '').localeCompare(a.placedAt ?? ''));
}

export async function saveDelivery(input: Delivery): Promise<Delivery> {
  const items = Array.isArray(input.items) ? input.items : [];
  // Every text column gets a string so a partial payload can never write `undefined`.
  const delivery: Delivery = {
    ...input,
    reference: input.reference ?? '',
    clientId: input.clientId || null,
    clientName: input.clientName ?? '',
    courier: input.courier ?? '',
    tracking: input.tracking ?? '',
    address: input.address ?? '',
    placedAt: input.placedAt ?? '',
    window: input.window ?? '',
    source: input.source ?? 'manual',
    county: input.county ?? '',
    email: input.email ?? '',
    phone: input.phone ?? '',
    notes: input.notes ?? '',
    mpesaReceipt: input.mpesaReceipt ?? '',
    items,
    total: items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0),
  };

  // Cancelling an order puts the units back on the shelf; un-cancelling takes them
  // off again. Without this, a cancelled order would leave its stock stranded.
  const previous = delivery.id ? await getDelivery(delivery.id) : undefined;
  if (previous) {
    const wasCancelled = previous.status === 'cancelled';
    const nowCancelled = delivery.status === 'cancelled';
    if (wasCancelled !== nowCancelled) {
      const requests: StockRequest[] = delivery.items
        .filter((i) => i.productId)
        .map((i) => ({ productId: i.productId as string, size: i.size, qty: i.qty }));
      if (requests.length > 0) {
        if (nowCancelled) await restoreStock(requests);
        else {
          const taken = await decrementStock(requests);
          // Reinstating an order whose stock is gone is refused rather than
          // silently resurrecting an order nobody can fulfil.
          if (!taken.ok) throw new Error('reason' in taken ? taken.reason : 'Out of stock');
        }
      }
    }
  }

  if (isDatabaseConfigured) {
    await execute(
      `INSERT INTO \`deliveries\`
         (id, reference, client_id, client_name, items, total, status, payment, courier, tracking, address, placed_at, window, source, county, email, phone, notes, mpesa_receipt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         reference = VALUES(reference), client_id = VALUES(client_id), client_name = VALUES(client_name),
         items = VALUES(items), total = VALUES(total), status = VALUES(status), payment = VALUES(payment),
         courier = VALUES(courier), tracking = VALUES(tracking), address = VALUES(address),
         placed_at = VALUES(placed_at), window = VALUES(window), source = VALUES(source), county = VALUES(county),
         email = VALUES(email), phone = VALUES(phone), notes = VALUES(notes), mpesa_receipt = VALUES(mpesa_receipt)`,
      [
        delivery.id, delivery.reference, delivery.clientId, delivery.clientName,
        JSON.stringify(delivery.items), delivery.total, delivery.status, delivery.payment,
        delivery.courier, delivery.tracking, delivery.address, delivery.placedAt || null,
        delivery.window, delivery.source, delivery.county, delivery.email, delivery.phone,
        delivery.notes, delivery.mpesaReceipt,
      ],
    );
    return delivery;
  }

  const store = await loadStore();
  const i = store.deliveries.findIndex((d) => d.id === delivery.id);
  if (i === -1) store.deliveries.unshift(delivery);
  else store.deliveries[i] = delivery;
  await saveStore(store);
  return delivery;
}

export async function deleteDelivery(id: string): Promise<void> {
  if (isDatabaseConfigured) {
    await execute('DELETE FROM `deliveries` WHERE `id` = ?', [id]);
    return;
  }
  const store = await loadStore();
  store.deliveries = store.deliveries.filter((d) => d.id !== id);
  await saveStore(store);
}

/* ================================================================== *
 * Messages (contact form inbox)
 * ================================================================== */

interface MessageRow {
  id: string;
  name: string;
  contact: string;
  subject: string;
  body: string | null;
  status: MessageStatus;
  notes: string | null;
  created_at: string | Date;
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    name: row.name ?? '',
    contact: row.contact ?? '',
    subject: row.subject ?? '',
    body: row.body ?? '',
    status: row.status ?? 'new',
    notes: row.notes ?? '',
    createdAt: toIso(row.created_at),
  };
}

export async function listMessages(): Promise<Message[]> {
  if (isDatabaseConfigured) {
    const rows = await sql<MessageRow>(
      'SELECT * FROM `messages` ORDER BY `created_at` DESC, `id` DESC',
    );
    return rows.map(toMessage);
  }
  const store = await loadStore();
  return [...store.messages].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function saveMessage(input: Partial<Message> & { id?: string }): Promise<Message> {
  const message: Message = {
    id: input.id || `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: (input.name ?? '').trim(),
    contact: (input.contact ?? '').trim(),
    subject: (input.subject ?? '').trim(),
    body: input.body ?? '',
    status: input.status ?? 'new',
    notes: input.notes ?? '',
    // An explicit createdAt keeps the submission time the visitor actually hit send.
    createdAt: input.createdAt || new Date().toISOString(),
  };

  if (isDatabaseConfigured) {
    await execute(
      `INSERT INTO \`messages\` (id, name, contact, subject, body, status, notes, created_at)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), contact = VALUES(contact), subject = VALUES(subject),
         body = VALUES(body), status = VALUES(status), notes = VALUES(notes)`,
      [
        message.id, message.name, message.contact, message.subject,
        message.body, message.status, message.notes, message.createdAt,
      ],
    );
    return message;
  }

  const store = await loadStore();
  const i = store.messages.findIndex((m) => m.id === message.id);
  if (i === -1) store.messages.unshift(message);
  else store.messages[i] = { ...store.messages[i], ...message };
  await saveStore(store);
  return message;
}

export async function deleteMessage(id: string): Promise<void> {
  if (isDatabaseConfigured) {
    await execute('DELETE FROM `messages` WHERE `id` = ?', [id]);
    return;
  }
  const store = await loadStore();
  store.messages = store.messages.filter((m) => m.id !== id);
  await saveStore(store);
}

/* ================================================================== *
 * Settings
 * ================================================================== */

export async function getSettings(): Promise<SystemSettings> {
  const defaults = seedSettings();
  if (isDatabaseConfigured) {
    const rows = await sql<{ key: string; value: unknown }>('SELECT * FROM `settings`');
    const map: Record<string, unknown> = {};
    for (const row of rows) {
      map[row.key] = parseJson<unknown>(row.value, undefined);
    }
    return { ...defaults, ...(map as Partial<SystemSettings>) };
  }
  const store = await loadStore();
  return { ...defaults, ...store.settings };
}

export async function saveSettings(input: SystemSettings): Promise<SystemSettings> {
  const next: SystemSettings = { ...seedSettings(), ...input };

  if (isDatabaseConfigured) {
    for (const [key, value] of Object.entries(next)) {
      await execute(
        'INSERT INTO `settings` (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [key, JSON.stringify(value)],
      );
    }
    return next;
  }

  const store = await loadStore();
  store.settings = next;
  await saveStore(store);
  return next;
}

/* ================================================================== *
 * Everything at once — the dashboard loads in one request
 * ================================================================== */

export async function loadAdminSnapshot() {
  const [products, promos, clients, deliveries, messages, settings] = await Promise.all([
    listProducts(true),
    listPromos(),
    listClients(),
    listDeliveries(),
    listMessages(),
    getSettings(),
  ]);
  return { products, promos, clients, deliveries, messages, settings };
}
