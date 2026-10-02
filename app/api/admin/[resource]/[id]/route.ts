import { ApiError, fail, ok, readJson, requireAdmin, getResource } from '@/lib/server/resources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT    /api/admin/products/:id
 * DELETE /api/admin/products/:id
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  try {
    await requireAdmin();
    const { resource, id } = await params;
    const handler = getResource(resource);
    const body = await readJson<Record<string, unknown>>(request);

    // Merge onto the stored record: a partial payload (e.g. just { status }) must not
    // wipe the fields it does not mention.
    const existing = (await handler.list(true)).find(
      (item) => (item as { id?: string }).id === id,
    );
    if (!existing) throw new ApiError(404, `No ${resource} record with id "${id}"`);

    // The id in the URL wins so a stale client payload cannot retarget a record.
    const saved = await handler.save({ ...(existing as object), ...body, id } as never);
    return ok({ item: saved });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  try {
    await requireAdmin();
    const { resource, id } = await params;
    await getResource(resource).remove(id);
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
