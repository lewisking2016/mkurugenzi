import { getResource, fail, ok, readJson, requireAdmin } from '@/lib/server/resources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET  /api/admin/products[?includeArchived=true]
 * POST /api/admin/products   { ...record }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    await requireAdmin();
    const { resource } = await params;
    const includeArchived =
      new URL(request.url).searchParams.get('includeArchived') === 'true';
    const handler = getResource(resource);
    return ok({ items: await handler.list(includeArchived) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    await requireAdmin();
    const { resource } = await params;
    const handler = getResource(resource);
    const body = await readJson<Record<string, unknown>>(request);
    const saved = await handler.save(body as never);
    return ok({ item: saved }, 201);
  } catch (error) {
    return fail(error);
  }
}
