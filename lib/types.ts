/**
 * Domain types shared by the storefront, the admin UI and the server repository.
 * Kept free of React and Node imports so every layer can import it safely.
 */

/* ----------------------------- Products ----------------------------- */

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: 'gents' | 'ladies' | 'unisex' | 'accessories';
  price: number;
  compareAtPrice?: number;
  stock: number;
  sold: number;
  sizes: string[];
  /**
   * Units on hand per size, keyed by the size label (e.g. `{ S: 4, M: 0 }`).
   * A flat `stock` number cannot stop you selling a size you do not have, so the
   * admin editor keeps one row per size and checkout decrements the right one.
   * Sizes missing from the map fall back to the flat `stock` value.
   */
  sizeStock?: Record<string, number>;
  badge?: string;
  status: ProductStatus;
  img: string;
  hoverImg?: string;
  description: string;
}

/* ---------------------------- Promotions ---------------------------- */

export type PromoType = 'percent' | 'fixed' | 'shipping';

export interface Promo {
  id: string;
  code: string;
  title: string;
  type: PromoType;
  value: number;
  startsAt: string;
  endsAt: string;
  used: number;
  limit: number;
  active: boolean;
}

/* ------------------------------ Clients ----------------------------- */

export type ClientTier = 'vip' | 'regular' | 'new';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  orders: number;
  spent: number;
  tier: ClientTier;
  joinedAt: string;
  notes: string;
}

/* ---------------------------- Deliveries ---------------------------- */

export type DeliveryStatus =
  | 'awaiting_payment'
  | 'confirmed'
  | 'packed'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'mpesa' | 'paypal' | 'card' | 'cod';

export interface DeliveryItem {
  name: string;
  size: string;
  qty: number;
  price: number;
  /** Product id, so reports can attribute a sale to a catalogue item. */
  productId?: string;
}

/** Where the order came from — a storefront checkout or a phone/in-person sale. */
export type OrderSource = 'web' | 'manual';

export interface Delivery {
  id: string;
  reference: string;
  clientId: string | null;
  clientName: string;
  items: DeliveryItem[];
  total: number;
  status: DeliveryStatus;
  payment: PaymentMethod;
  courier: string;
  tracking: string;
  address: string;
  placedAt: string;
  window: string;
  /** `web` orders arrive from /checkout; `manual` ones the team types in. */
  source?: OrderSource;
  county?: string;
  email?: string;
  /** Contact number the customer gave at checkout — the team calls or WhatsApps this. */
  phone?: string;
  /** What the customer wrote at checkout — delivery notes, gift message, etc. */
  notes?: string;
  /** M-Pesa confirmation code, so the team can match a payment to an order. */
  mpesaReceipt?: string;
}

/* ---------------------------- Messages ----------------------------- */

/** `new` = untouched inbox, `replied` = the team answered, `archived` = filed away. */
export type MessageStatus = 'new' | 'read' | 'replied' | 'archived';

/** A submission from the contact form on /contact. */
export interface Message {
  id: string;
  name: string;
  /** Free-form so the visitor can give a phone number or an email address. */
  contact: string;
  subject: string;
  body: string;
  status: MessageStatus;
  /** Private note for the team — never shown on the storefront. */
  notes: string;
  createdAt: string;
}

/* ----------------------------- Settings ----------------------------- */

export interface SystemSettings {
  storeName: string;
  email: string;
  phone: string;
  whatsapp: string;
  currency: string;
  freeDeliveryThreshold: number;
  deliveryFeeNairobi: number;
  deliveryFeeOutside: number;
  lowStockAlert: number;
  mpesaPaybill: string;
  autoConfirmMpesa: boolean;
  orderNotifications: boolean;
  weeklyReport: boolean;
}

/* -------------------------- Status metadata ------------------------- */

export const DELIVERY_STATUS: Record<DeliveryStatus, { label: string; chip: string }> = {
  awaiting_payment: { label: 'Awaiting payment', chip: 'bg-[#f0f0f1] text-black/60' },
  confirmed: { label: 'Confirmed', chip: 'bg-[#0d0d0d] text-white' },
  packed: { label: 'Packed', chip: 'bg-[#e7e7ea] text-black/70' },
  in_transit: { label: 'In transit', chip: 'bg-black/10 text-black/70' },
  delivered: { label: 'Delivered', chip: 'bg-black text-white' },
  cancelled: { label: 'Cancelled', chip: 'bg-white text-black/40 border border-black/10' },
};

export const DELIVERY_FLOW: DeliveryStatus[] = [
  'awaiting_payment',
  'confirmed',
  'packed',
  'in_transit',
  'delivered',
];

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  mpesa: 'M-Pesa',
  paypal: 'PayPal',
  card: 'Card',
  cod: 'Pay on delivery',
};

export const PRODUCT_STATUS: Record<ProductStatus, { label: string; chip: string }> = {
  active: { label: 'Active', chip: 'bg-[#0d0d0d] text-white' },
  draft: { label: 'Draft', chip: 'bg-[#f0f0f1] text-black/60' },
  archived: { label: 'Archived', chip: 'bg-white text-black/40 border border-black/10' },
};

export const MESSAGE_STATUS: Record<MessageStatus, { label: string; chip: string }> = {
  new: { label: 'New', chip: 'bg-[#0d0d0d] text-white' },
  read: { label: 'Read', chip: 'bg-[#f0f0f1] text-black/60' },
  replied: { label: 'Replied', chip: 'bg-white text-black/45 border border-black/10' },
  archived: { label: 'Archived', chip: 'bg-white text-black/30 border border-black/10' },
};

export const TIER_LABEL: Record<ClientTier, string> = {
  vip: 'VIP',
  regular: 'Regular',
  new: 'New',
};

/* ------------------------------ Helpers ----------------------------- */

export const KES = (n: number) => `KES ${n.toLocaleString('en-KE')}`;

/**
 * Units available in a given size. Prefers the per-size map and falls back to the
 * flat stock number for products whose sizes have never been broken out.
 */
export function sizeAvailability(product: Pick<Product, 'stock' | 'sizes' | 'sizeStock'>, size: string) {
  const perSize = product.sizeStock?.[size];
  if (perSize == null) return product.stock;
  return Math.max(0, Math.round(Number(perSize) || 0));
}

/** Total units across every size — the number the dashboard's low-stock alert uses. */
export function totalStock(product: Pick<Product, 'stock' | 'sizes' | 'sizeStock'>) {
  if (!product.sizeStock || Object.keys(product.sizeStock).length === 0) return product.stock;
  return product.sizes.reduce((sum, size) => sum + sizeAvailability(product, size), 0);
}

/** Sizes a shopper can actually pick right now. */
export function availableSizes(product: Pick<Product, 'stock' | 'sizes' | 'sizeStock'>) {
  return product.sizes.filter((size) => sizeAvailability(product, size) > 0);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '—';
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '—';
  return `${d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Whole days since an ISO timestamp — used for the inbox "2d ago" labels. */
export function daysSince(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

export function daysLeft(iso: string) {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86_400_000);
}
