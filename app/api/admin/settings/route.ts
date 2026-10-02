import { fail, ok, readJson, requireAdmin } from '@/lib/server/resources';
import { getSettings, saveSettings } from '@/lib/server/repo';
import type { SystemSettings } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    return ok({ settings: await getSettings() });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await readJson<SystemSettings>(request);
    return ok({ settings: await saveSettings(body) });
  } catch (error) {
    return fail(error);
  }
}
