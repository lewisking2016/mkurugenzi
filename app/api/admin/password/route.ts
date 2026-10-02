import { NextResponse } from 'next/server';
import { fail, ok, readJson, requireAdmin } from '@/lib/server/resources';
import { findUserById, hashPassword, saveUser, verifyPassword } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Self-service password change.
 *
 * The current password must be supplied even though the caller is already signed
 * in: an unattended or hijacked session should not be enough to lock the owner
 * out of their own store. This is the screen that retires the seeded
 * `mkurugenzi-admin` default for good.
 */
export async function PUT(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = await readJson<{ currentPassword?: string; newPassword?: string }>(request);

    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '');

    if (newPassword.length < 10) {
      return NextResponse.json({ error: 'Use a password of at least 10 characters.' }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'Choose a password different from the current one.' }, { status: 400 });
    }

    const user = await findUserById(actor.id);
    if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    if (!(await verifyPassword(currentPassword, user.password_hash))) {
      return NextResponse.json({ error: 'That is not your current password.' }, { status: 403 });
    }

    await saveUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      password_hash: await hashPassword(newPassword),
    });

    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
