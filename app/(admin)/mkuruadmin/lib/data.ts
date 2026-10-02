/**
 * Admin-side re-export so screens can import types and seeds from one place.
 * The real definitions live in `lib/types.ts` and `lib/seed.ts` so the server
 * repository and the admin UI share exactly the same shapes.
 */

export * from '@/lib/types';
export {
  PRODUCTS, slugify, seedProducts, seedPromos, seedClients, seedDeliveries, seedSettings,
} from '@/lib/seed';
