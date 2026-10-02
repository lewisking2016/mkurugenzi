/**
 * Seed data for a fresh install and local development.
 * `npm run db:setup` writes this into MySQL; the storefront catalog in
 * `data/products.ts` remains the source of truth for the marketing pages.
 */

import { PRODUCTS } from '@/data/products';
import type {
  Client, Delivery, DeliveryStatus, Message, PaymentMethod, Product, Promo, SystemSettings,
} from './types';

// Re-export the shared vocabulary so admin screens can import everything from one place.
export * from './types';
export { PRODUCTS };

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function seedProducts(): Product[] {
  return PRODUCTS.map((p) => {
    // Spread stock levels so the low-stock alerts are meaningful on a fresh install.
    const stock = 2 + ((Number(p.id) * 7) % 26);
    // Break that stock across the sizes. The `(i * 3) % 5` term leaves some sizes at
    // zero so the sold-out state and the per-size low-stock alert are both visible.
    const sizeStock: Record<string, number> = {};
    p.sizes.forEach((size, i) => {
      sizeStock[size] = Math.max(0, Math.round(stock / p.sizes.length) + ((i * 3) % 5) - 2);
    });
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock,
      sold: p.sold ?? 0,
      sizes: p.sizes,
      sizeStock,
      badge: p.badge,
      status: 'active' as const,
      img: p.img,
      hoverImg: p.hoverImg,
      description: p.description,
    };
  });
}

export function seedPromos(): Promo[] {
  return [
    {
      id: 'p1',
      code: 'NAIROBI10',
      title: 'Nairobi launch week',
      type: 'percent',
      value: 10,
      startsAt: '2026-09-01',
      endsAt: '2026-12-31',
      used: 84,
      limit: 300,
      active: true,
    },
    {
      id: 'p2',
      code: 'FREESHIP',
      title: 'Free delivery countywide',
      type: 'shipping',
      value: 0,
      startsAt: '2026-08-15',
      endsAt: '2026-11-30',
      used: 131,
      limit: 500,
      active: true,
    },
    {
      id: 'p3',
      code: 'BUNDLE500',
      title: 'Off KES 500 on 3+ items',
      type: 'fixed',
      value: 500,
      startsAt: '2026-10-01',
      endsAt: '2026-10-31',
      used: 27,
      limit: 100,
      active: false,
    },
  ];
}

export function seedClients(): Client[] {
  return [
    {
      id: 'c1', name: 'Achieng Odhiambo', phone: '+254 712 004 118', email: 'achieng@example.com',
      city: 'Nairobi', orders: 14, spent: 42800, tier: 'vip', joinedAt: '2025-11-04',
      notes: 'Prefers WhatsApp. Usually orders caps.',
    },
    {
      id: 'c2', name: 'Brian Mutua', phone: '+254 733 551 902', email: 'brian.m@example.com',
      city: 'Nairobi', orders: 6, spent: 15900, tier: 'regular', joinedAt: '2026-02-18', notes: '',
    },
    {
      id: 'c3', name: 'Wanjiku Kamau', phone: '+254 701 887 340', email: 'wanjiku.k@example.com',
      city: 'Nakuru', orders: 2, spent: 4300, tier: 'new', joinedAt: '2026-09-22',
      notes: 'Referred by Achieng.',
    },
    {
      id: 'c4', name: 'Kevin Otieno', phone: '+254 720 334 776', email: 'kev.otieno@example.com',
      city: 'Kisumu', orders: 9, spent: 27450, tier: 'regular', joinedAt: '2026-01-09',
      notes: 'Ships to a PO box.',
    },
    {
      id: 'c5', name: 'Mercy Njeri', phone: '+254 715 902 118', email: 'mercy.n@example.com',
      city: 'Nairobi', orders: 21, spent: 68300, tier: 'vip', joinedAt: '2025-08-12',
      notes: 'Wholesale enquiries.',
    },
    {
      id: 'c6', name: 'Samuel Kiplagat', phone: '+254 711 226 540', email: 'sam.k@example.com',
      city: 'Eldoret', orders: 1, spent: 2400, tier: 'new', joinedAt: '2026-10-01', notes: '',
    },
    {
      id: 'c7', name: 'Nadia Hassan', phone: '+254 707 419 663', email: 'nadia.h@example.com',
      city: 'Mombasa', orders: 4, spent: 11800, tier: 'regular', joinedAt: '2026-05-30', notes: '',
    },
    {
      id: 'c8', name: 'Peter Mwangi', phone: '+254 722 660 145', email: 'peter.m@example.com',
      city: 'Thika', orders: 3, spent: 7600, tier: 'regular', joinedAt: '2026-07-19',
      notes: 'Corporate hoodie order.',
    },
    {
      id: 'c9', name: 'Grace Wanjiru', phone: '+254 708 774 021', email: 'grace.w@example.com',
      city: 'Nairobi', orders: 1, spent: 1800, tier: 'new', joinedAt: '2026-09-30', notes: '',
    },
    {
      id: 'c10', name: 'Daniel Kimani', phone: '+254 725 118 903', email: 'daniel.k@example.com',
      city: 'Nakuru', orders: 7, spent: 19600, tier: 'regular', joinedAt: '2026-03-14',
      notes: 'Ask about restock.',
    },
    {
      id: 'c11', name: 'Faith Chebet', phone: '+254 719 330 288', email: 'faith.c@example.com',
      city: 'Kericho', orders: 2, spent: 5200, tier: 'new', joinedAt: '2026-08-27', notes: '',
    },
    {
      id: 'c12', name: 'Joseph Ouma', phone: '+254 704 552 019', email: 'joseph.o@example.com',
      city: 'Kisumu', orders: 12, spent: 38900, tier: 'vip', joinedAt: '2025-12-05',
      notes: 'Long-standing client.',
    },
  ];
}

export function seedDeliveries(): Delivery[] {
  const clients = seedClients();
  const byId = (id: string) => clients.find((c) => c.id === id)!;

  const mk = (
    id: string,
    reference: string,
    clientId: string,
    items: Delivery['items'],
    status: DeliveryStatus,
    payment: PaymentMethod,
    courier: string,
    tracking: string,
    placedAt: string,
    window: string,
    address: string,
  ): Delivery => ({
    id,
    reference,
    clientId,
    clientName: byId(clientId).name,
    items,
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    status,
    payment,
    courier,
    tracking,
    address,
    placedAt,
    window,
  });

  return [
    mk('d1', 'MK-2041', 'c1', [
      { name: 'Cap – Black', size: 'One size', qty: 2, price: 1800 },
      { name: 'Socks – A Pack Of 3', size: 'M', qty: 1, price: 1000 },
    ], 'in_transit', 'mpesa', 'Gokada Express', 'GKE-8827341', '2026-09-28', 'Oct 3, 9am – 12pm', 'Lavington, Nairobi'),
    mk('d2', 'MK-2042', 'c5', [{ name: 'Hoodie – Mkurugenzi', size: 'L', qty: 6, price: 4500 }],
      'packed', 'card', 'Internal courier', 'INT-1190', '2026-09-30', 'Oct 4, 2pm – 5pm', 'Westlands, Nairobi'),
    mk('d3', 'MK-2043', 'c4', [
      { name: 'T-Shirt – Logo', size: 'M', qty: 3, price: 2200 },
      { name: 'Cap – Black', size: 'One size', qty: 1, price: 1800 },
    ], 'confirmed', 'mpesa', 'Gokada Express', 'GKE-8827409', '2026-10-01', 'Oct 5, 10am – 1pm', 'Kisumu town'),
    mk('d4', 'MK-2044', 'c7', [{ name: 'Beanie', size: 'One size', qty: 1, price: 1600 }],
      'awaiting_payment', 'cod', '—', '—', '2026-10-01', 'Pending', 'Nyali, Mombasa'),
    mk('d5', 'MK-2045', 'c12', [
      { name: 'Hoodie – Mkurugenzi', size: 'XL', qty: 4, price: 4500 },
      { name: 'Cap – Black', size: 'One size', qty: 2, price: 1800 },
    ], 'delivered', 'mpesa', 'Gokada Express', 'GKE-8827102', '2026-09-22', 'Delivered Sep 26', 'Kisumu town'),
    mk('d6', 'MK-2046', 'c10', [{ name: 'Socks – A Pack Of 3', size: 'L', qty: 2, price: 1000 }],
      'delivered', 'paypal', 'Gokada Express', 'GKE-8827158', '2026-09-24', 'Delivered Sep 27', 'Nakuru'),
    mk('d7', 'MK-2047', 'c2', [{ name: 'T-Shirt – Logo', size: 'L', qty: 1, price: 2200 }],
      'cancelled', 'mpesa', '—', '—', '2026-09-29', 'Cancelled', 'Nairobi'),
    mk('d8', 'MK-2048', 'c8', [{ name: 'Beanie', size: 'One size', qty: 2, price: 1600 }],
      'confirmed', 'card', 'Internal courier', 'INT-1203', '2026-10-02', 'Oct 6, 9am – 12pm', 'Thika'),
  ];
}

/** A few example inbox items so the messages screen is not empty on a fresh install. */
export function seedMessages(): Message[] {
  return [
    {
      id: 'm1',
      name: 'Wanjiku Kamau',
      contact: '+254 701 887 340',
      subject: 'Bulk hoodie order for a girls team',
      body: 'Hi, we are a mixed-gender team of 24 and need hoodies in navy before the Nakuru athletics meet. Can you do 12 medium and 12 large? What is the bulk price and how long would printing take?',
      status: 'new',
      notes: '',
      createdAt: '2026-10-02T09:12:00.000Z',
    },
    {
      id: 'm2',
      name: 'Samuel Kiplagat',
      contact: 'sam.k@example.com',
      subject: 'Does the cap run small?',
      body: 'I have a 58cm head and the caps look adjustable. Will one still fit, or should I order the beanie instead?',
      status: 'read',
      notes: 'Answered on WhatsApp — sent size guide.',
      createdAt: '2026-10-01T16:40:00.000Z',
    },
    {
      id: 'm3',
      name: 'Nadia Hassan',
      contact: '+254 707 419 663',
      subject: 'Delivery to Mombasa',
      body: 'If I order two hoodies today, when would they reach Nyali and what would shipping cost?',
      status: 'replied',
      notes: 'Gokada quote shared, 3 working days, KES 500.',
      createdAt: '2026-09-30T11:05:00.000Z',
    },
    {
      id: 'm4',
      name: 'Guest',
      contact: 'hello@example.com',
      subject: 'Stockist enquiry',
      body: 'We run a small boutique in Westlands and would like to stock a few pieces. Do you have a wholesale sheet?',
      status: 'archived',
      notes: 'Waiting on the wholesale price list before replying.',
      createdAt: '2026-09-28T08:30:00.000Z',
    },
  ];
}

export function seedSettings(): SystemSettings {
  return {
    storeName: 'Mkurugenzi',
    email: 'info@mkurugenzi.co.ke',
    phone: '+254 716 265 661',
    whatsapp: '+254 716 265 661',
    currency: 'KES',
    freeDeliveryThreshold: 10000,
    deliveryFeeNairobi: 250,
    deliveryFeeOutside: 500,
    lowStockAlert: 10,
    mpesaPaybill: '522533',
    autoConfirmMpesa: true,
    orderNotifications: true,
    weeklyReport: false,
  };
}
