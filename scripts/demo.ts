/**
 * Demo data reset.
 *
 *   npm run demo:reset
 *
 * Re-seeds the local `.data/` store so every admin screen has something real in
 * it, then re-dates everything relative to *today* so the Reports screen still
 * shows sensible numbers whenever the demo is given. The stock seed in
 * `lib/seed.ts` uses fixed dates, which quietly decays: a week later "Last 30
 * days" starts missing rows and the period comparison reads as zero.
 *
 * Also marks several orders as having come from the website, so the Online
 * badge, the source filter and the county breakdown all have data to show.
 *
 * This only touches the local development store. It refuses to run against a
 * real database.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

/** "3" = three days ago, "-2" = two days from now. */
function shiftDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function stampDays(days: number, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

async function main() {
  const { isDatabaseConfigured, fallbackFile } = await import('../lib/server/db');

  if (isDatabaseConfigured) {
    console.error(
      '\n  Refusing to run: a real database is configured.\n' +
        '  demo:reset only ever touches the local .data/ store.\n',
    );
    process.exit(1);
  }

  // Start from the same seed the installer uses, so this stays honest about
  // what a real install looks like.
  const seeds = await import('../lib/seed');
  const repo = await import('../lib/server/repo');

  const store = {
    products: seeds.seedProducts(),
    promos: seeds.seedPromos(),
    clients: seeds.seedClients(),
    deliveries: seeds.seedDeliveries(),
    messages: seeds.seedMessages(),
    settings: seeds.seedSettings(),
  };

  // Re-date the orders so the report windows always have something in them.
  // Same relative spacing the seed used, measured from today instead of 2026-09.
  const agesInDays: Record<string, number> = {
    d1: -4,  // in transit
    d2: -2,  // packed
    d3: -1,  // confirmed
    d4: 0,   // awaiting payment, today
    d5: -10, // delivered
    d6: -8,  // delivered
    d7: -6,  // cancelled
    d8: 0,   // confirmed, today
  };
  for (const order of store.deliveries) {
    const age = agesInDays[order.id];
    if (age !== undefined) order.placedAt = shiftDays(age);
  }

  // Half the orders came through the website. These are the ones that show the
  // Online badge, carry a phone number and county, and feed the county chart.
  const webOrders: Record<string, { county: string; phone: string; email: string; notes: string }> = {
    d1: { county: 'Nairobi', phone: '0722 118 340', email: 'james@kiplangat.co.ke', notes: 'Gate colour is green — ask for Peter.' },
    d3: { county: 'Nairobi', phone: '0713 004 112', email: 'nadia.hassan@gmail.com', notes: '' },
    d4: { county: 'Mombasa', phone: '0700 552 918', email: 'samuel.k@example.com', notes: 'Deliver after 4pm, I close at 3.' },
    d8: { county: 'Kisumu', phone: '0755 883 204', email: 'otieno@mail.com', notes: 'Paying on delivery, have the exact amount ready.' },
  };
  for (const order of store.deliveries) {
    const extra = webOrders[order.id];
    if (extra) {
      order.source = 'web';
      order.county = extra.county;
      order.phone = extra.phone;
      order.email = extra.email;
      order.notes = extra.notes;
    } else {
      order.source = 'manual';
    }
  }

  // Give the delivered orders an M-Pesa receipt so the Orders screen shows a
  // matched payment rather than an empty field.
  for (const order of store.deliveries) {
    if (order.status === 'delivered' && order.payment === 'mpesa') {
      order.mpesaReceipt = `QJG${Math.floor(100000 + Math.random() * 899999)}`;
    }
  }

  // A few products that have never sold, so the Reports "Slow movers" panel has
  // something to show. The catalogue seed gives every product a lifetime sales
  // figure, which would otherwise make the panel read "everything is selling".
  const neverSold = new Set([
    'Tote Bag – White',
    'Beanie Hat – Beige',
    'Quarter Zip – Desert Sand',
    'T-Shirt – Desert Sand',
  ]);
  for (const product of store.products) {
    if (neverSold.has(product.name)) product.sold = 0;
  }

  // Three older orders, 35-50 days back. Without them the "vs previous period"
  // comparison has an empty window and every stat card reads "No orders in the
  // previous period", which makes a live dashboard look broken.
  const olderOrders = [
    {
      id: 'd90', reference: 'MK-2036', clientId: 'c7',
      items: [{ name: 'Hoodie – Mkurugenzi', size: 'M', qty: 1, price: 4500 }],
      status: 'delivered' as const, payment: 'mpesa' as const,
      courier: 'Gokada Express', tracking: 'GKE-8701223', placedAt: shiftDays(-38),
      window: 'Delivered', address: 'Kileleshwa, Nairobi',
    },
    {
      id: 'd91', reference: 'MK-2039', clientId: 'c9',
      items: [
        { name: 'Socks – A Pack Of 3', size: 'L', qty: 2, price: 1000 },
        { name: 'Cap – Black', size: 'One size', qty: 1, price: 1800 },
      ],
      status: 'delivered' as const, payment: 'cod' as const,
      courier: 'Internal courier', tracking: '', placedAt: shiftDays(-45),
      window: 'Delivered', address: 'Nakuru Town',
    },
    {
      id: 'd92', reference: 'MK-2040', clientId: 'c11',
      items: [{ name: 'Quarter Zip – Black Excellence', size: 'L', qty: 1, price: 5200 }],
      status: 'delivered' as const, payment: 'card' as const,
      courier: 'Gokada Express', tracking: 'GKE-8810990', placedAt: shiftDays(-52),
      window: 'Delivered', address: 'Karen, Nairobi',
    },
    {
      id: 'd93', reference: 'MK-2033', clientId: 'c3',
      items: [{ name: 'Sweatsuits – Black Excellence', size: 'M', qty: 2, price: 6500 }],
      status: 'delivered' as const, payment: 'mpesa' as const,
      courier: 'Gokada Express', tracking: 'GKE-8665410', placedAt: shiftDays(-41),
      window: 'Delivered', address: 'Parklands, Nairobi',
    },
    {
      id: 'd94', reference: 'MK-2037', clientId: 'c6',
      items: [
        { name: 'Jacket – Black Icon', size: 'L', qty: 1, price: 8500 },
        { name: 'Socks – A Pack Of 3', size: 'M', qty: 1, price: 1000 },
      ],
      status: 'delivered' as const, payment: 'paypal' as const,
      courier: 'Internal courier', tracking: '', placedAt: shiftDays(-36),
      window: 'Delivered', address: 'Ruiru, Kiambu',
    },
  ];
  const clientById = (id: string) => store.clients.find((c) => c.id === id)!;
  for (const order of olderOrders) {
    store.deliveries.push({
      ...order,
      clientName: clientById(order.clientId).name,
      total: order.items.reduce((s, i) => s + i.price * i.qty, 0),
      source: 'web',
      county: order.address.includes('Nakuru') ? 'Nakuru' : 'Nairobi',
      email: '',
      notes: '',
      mpesaReceipt: order.payment === 'mpesa' ? 'QJG204871133' : '',
    } as never);
  }

  // Re-date the inbox so "2d ago" labels read correctly at any time of day.
  const messageAges: Record<string, number> = { m1: 0, m2: -4, m3: -2, m4: -1 };
  for (const message of store.messages) {
    const age = messageAges[message.id];
    if (age !== undefined) message.createdAt = stampDays(age, 9);
  }

  await fs.mkdir(path.dirname(fallbackFile('store')), { recursive: true });
  await fs.writeFile(fallbackFile('store'), JSON.stringify(store, null, 2), 'utf8');

  // The uploads folder has to exist or the image uploader errors on first use.
  await fs.mkdir(path.join(root, 'uploads'), { recursive: true }).catch(() => undefined);

  // Two accounts, so the Account & staff screen has a row that is not "you".
  const { hashPassword, saveUser } = await import('../lib/server/auth');
  await saveUser({
    id: 'u_admin',
    email: 'admin@mkurugenzi.co.ke',
    name: 'Lewis King',
    role: 'admin',
    password_hash: await hashPassword('mkurugenzi-admin'),
  });
  await saveUser({
    id: 'u_staff',
    email: 'staff@mkurugenzi.co.ke',
    name: 'Achieng Odhiambo',
    role: 'staff',
    password_hash: await hashPassword('quiet-river-88'),
  });

  const revenue = store.deliveries
    .filter((d) => d.status !== 'cancelled')
    .reduce((sum, d) => sum + d.total, 0);

  console.log('\n  Demo data ready.\n');
  console.log(`  ${store.products.length} products, ${store.deliveries.length} orders, ${store.clients.length} clients`);
  console.log(`  ${store.messages.length} inbox messages, ${store.deliveries.filter((d) => d.source === 'web').length} orders tagged as website`);
  console.log(`  ${revenue.toLocaleString('en-KE')} KES in the order book\n`);
  console.log('  Admin   admin@mkurugenzi.co.ke / mkurugenzi-admin');
  console.log('  Staff   staff@mkurugenzi.co.ke  / quiet-river-88\n');
}

main().catch((error) => {
  console.error('\n  Demo reset failed:', error instanceof Error ? error.message : error, '\n');
  process.exit(1);
});
