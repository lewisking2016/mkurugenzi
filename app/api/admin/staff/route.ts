import { NextResponse } from 'next/server';
import { ApiError, fail, ok, readJson, requireAdmin } from '@/lib/server/resources';
import { deleteUser, findUserById, hashPassword, listUsers, saveUser } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Staff account management.
 *
 * Everyone who signs in to /mkuruadmin has a row in `users`, so adding a
 * colleague is just another row — no shared passwords, and a leaver can be
 * removed without touching anybody else's access.
 *
 * The route is admin-only: a `staff` account can run the shop but cannot mint
 * more accounts or change roles, so one compromised login cannot escalate.
 */

const ROLES = ['admin', 'manager', 'staff'] as const;
type Role = (typeof ROLES)[number];

const isRole = (value: unknown): value is Role => ROLES.includes(value as Role);

const newId = () => `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** GET /api/admin/staff — everyone, without their password hashes. */
export async function GET() {
  try {
    await requireAdmin();
    return ok({ items: await listUsers() });
  } catch (error) {
    return fail(error);
  }
}

/** POST /api/admin/staff — create an account. */
export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    if (actor.role !== 'admin') throw new ApiError(403, 'Only an admin can add staff accounts');

    const body = await readJson<Record<string, unknown>>(request);
    const email = String(body.email ?? '').trim().toLowerCase();
    const name = String(body.name ?? '').trim().slice(0, 120) || email;
    const password = String(body.password ?? '');
    const role = isRole(body.role) ? body.role : 'staff';

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address');
    if (password.length < 10) throw new ApiError(400, 'Use a password of at least 10 characters');

    const existing = await listUsers();
    if (existing.some((u) => u.email.toLowerCase() === email)) {
      throw new ApiError(409, 'An account with that email already exists');
    }

    const user = await saveUser({
      id: newId(),
      email,
      name,
      role,
      password_hash: await hashPassword(password),
    });
    const { password_hash: _omitted, ...safe } = user;
    return ok({ item: safe }, 201);
  } catch (error) {
    return fail(error);
  }
}

/** PUT /api/admin/staff — change a name, role or password. */
export async function PUT(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = await readJson<Record<string, unknown>>(request);
    const id = String(body.id ?? '').trim();
    if (!id) throw new ApiError(400, 'id is required');

    const users = await listUsers();
    const target = users.find((u) => u.id === id);
    if (!target) throw new ApiError(404, 'No such staff account');

    // Everyone may change their own name and password; only an admin may touch
    // roles, and nobody may re-role the last remaining admin.
    const changingRole = body.role !== undefined;
    if (changingRole && actor.role !== 'admin') {
      throw new ApiError(403, 'Only an admin can change roles');
    }

    let role = target.role;
    if (changingRole) {
      if (!isRole(body.role)) throw new ApiError(400, 'Unknown role');
      role = body.role;
      const admins = users.filter((u) => u.role === 'admin');
      if (target.role === 'admin' && role !== 'admin' && admins.length <= 1) {
        throw new ApiError(400, 'You cannot remove the last admin — add another one first');
      }
    }

    const name = body.name === undefined ? target.name : String(body.name).trim().slice(0, 120) || target.name;

    let passwordHash: string | undefined;
    if (body.password) {
      if (id !== actor.id && actor.role !== 'admin') {
        throw new ApiError(403, 'You can only change your own password');
      }
      const password = String(body.password);
      if (password.length < 10) throw new ApiError(400, 'Use a password of at least 10 characters');
      passwordHash = await hashPassword(password);
    }

    const saved = await saveUser({
      id: target.id,
      email: target.email,
      name,
      role,
      password_hash: passwordHash ?? (await currentHash(target.id)),
    });
    const { password_hash: _omitted, ...safe } = saved;
    return ok({ item: safe });
  } catch (error) {
    return fail(error);
  }
}

/** DELETE /api/admin/staff?id=... — revoke access. */
export async function DELETE(request: Request) {
  try {
    const actor = await requireAdmin();
    if (actor.role !== 'admin') throw new ApiError(403, 'Only an admin can remove staff accounts');

    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new ApiError(400, 'id is required');
    if (id === actor.id) throw new ApiError(400, 'You cannot remove your own account while signed in');

    const users = await listUsers();
    const target = users.find((u) => u.id === id);
    if (!target) throw new ApiError(404, 'No such staff account');
    if (target.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1) {
      throw new ApiError(400, 'You cannot remove the last admin');
    }

    await deleteUser(id);
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}

/** Re-reads the stored hash so a name/role change never blanks the password. */
async function currentHash(id: string): Promise<string> {
  const row = await findUserById(id);
  if (!row) throw new ApiError(404, 'No such staff account');
  return row.password_hash;
}
