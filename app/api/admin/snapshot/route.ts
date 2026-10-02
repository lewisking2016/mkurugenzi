import { fail, ok, requireAdmin } from '@/lib/server/resources';
import { loadAdminSnapshot } from '@/lib/server/repo';
import { isDatabaseConfigured } from '@/lib/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One round trip for the dashboard: products, promos, clients, deliveries, settings. */
export async function GET() {
  try {
    await requireAdmin();
    const snapshot = await loadAdminSnapshot();
    return ok({ ...snapshot, storage: isDatabaseConfigured ? 'mysql' : 'local-file' });
  } catch (error) {
    return fail(error);
  }
}
