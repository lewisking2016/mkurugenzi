import { NextResponse } from 'next/server';
import { getSettings, listProducts } from '@/lib/server/repo';
import { availableSizes } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public, read-only storefront data: the delivery thresholds the checkout quotes
 * and the per-size availability the size picker needs.
 *
 * Only non-sensitive fields are returned — no paybill, no email, nothing that
 * would help someone probe the admin. The catalogue is already visible in the
 * page HTML, so exposing ids, prices and stock adds nothing new.
 */
export async function GET() {
  try {
    const [settings, products] = await Promise.all([getSettings(), listProducts(false)]);

    const stock: Record<string, { sizeStock: Record<string, number>; availableSizes: string[] }> = {};
    for (const product of products) {
      stock[product.id] = {
        sizeStock: product.sizeStock ?? {},
        availableSizes: availableSizes(product),
      };
    }

    return NextResponse.json({
      currency: settings.currency,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      deliveryFeeNairobi: settings.deliveryFeeNairobi,
      deliveryFeeOutside: settings.deliveryFeeOutside,
      stock,
    });
  } catch (error) {
    console.error('[storefront]', error);
    return NextResponse.json({ error: 'Could not load store settings' }, { status: 500 });
  }
}
