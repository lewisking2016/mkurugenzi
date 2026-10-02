'use client';

import React from 'react';
import { KeyRound, UserPlus, ShieldCheck, Trash2, Users, Loader2 } from 'lucide-react';
import {
  Badge, Button, EmptyState, Field, Input, Modal, Panel, SectionHeader, Select, TableWrap, Td, Th,
} from '../components/ui';

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const ROLE_META: Record<string, { label: string; chip: string; blurb: string }> = {
  admin: { label: 'Admin', chip: 'bg-[#0d0d0d] text-white', blurb: 'Everything, including staff accounts and settings.' },
  manager: { label: 'Manager', chip: 'bg-[#f0f0f1] text-black/70', blurb: 'Run the shop: orders, products, clients, reports.' },
  staff: { label: 'Staff', chip: 'bg-white text-black/50 border border-black/10', blurb: 'Orders and messages only.' },
};

const ROLE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'same-origin',
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error('unauthenticated');
  if (!response.ok) throw new Error((payload as { error?: string }).error || 'Request failed');
  return payload as T;
}

export default function AdminAccountPage() {
  const [staff, setStaff] = React.useState<StaffUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [me, setMe] = React.useState<StaffUser | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [inviting, setInviting] = React.useState(false);
  const [removing, setRemoving] = React.useState<StaffUser | null>(null);

  // Password form
  const [passwords, setPasswords] = React.useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passwordBusy, setPasswordBusy] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // Invite form
  const [invite, setInvite] = React.useState({ name: '', email: '', password: '', role: 'staff' });
  const [inviteBusy, setInviteBusy] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [list, session] = await Promise.all([
        call<{ items: StaffUser[] }>('/api/admin/staff'),
        call<{ user?: StaffUser }>('/api/admin/session'),
      ]);
      setStaff(list.items);
      setMe(session.user ?? null);
    } catch (e) {
      if (e instanceof Error && e.message === 'unauthenticated') return;
      notify('Could not load staff accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const changePassword = async () => {
    setPasswordError(null);
    if (passwords.newPassword !== passwords.confirm) {
      setPasswordError('The two new passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      await call('/api/admin/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      notify('Password changed');
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : 'Could not change your password');
    } finally {
      setPasswordBusy(false);
    }
  };

  const sendInvite = async () => {
    setInviteError(null);
    setInviteBusy(true);
    try {
      await call('/api/admin/staff', { method: 'POST', body: JSON.stringify(invite) });
      setInviting(false);
      setInvite({ name: '', email: '', password: '', role: 'staff' });
      notify('Staff account created');
      await load();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Could not create the account');
    } finally {
      setInviteBusy(false);
    }
  };

  const changeRole = async (user: StaffUser, role: string) => {
    try {
      await call('/api/admin/staff', { method: 'PUT', body: JSON.stringify({ id: user.id, role }) });
      notify(`${user.name || user.email} is now ${ROLE_META[role]?.label ?? role}`);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not change the role');
    }
  };

  const removeStaff = async () => {
    if (!removing) return;
    try {
      await call(`/api/admin/staff?id=${encodeURIComponent(removing.id)}`, { method: 'DELETE' });
      notify(`${removing.name || removing.email} no longer has access`);
      setRemoving(null);
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not remove the account');
    }
  };

  const isAdmin = me?.role === 'admin';

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full bg-[#0d0d0d] text-white text-sm shadow-[0_18px_40px_-20px_rgba(0,0,0,0.5)]">
          {toast}
        </div>
      )}

      <div>
        <h1 className="section-heading text-3xl sm:text-4xl">Account</h1>
        <p className="text-sm text-black/50 mt-1">
          Your password, and who else can sign in to the store.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change password */}
        <Panel>
          <SectionHeader
            title="Change your password"
            sub="Especially important if you are still on the password set up by the installer"
          />
          <div className="space-y-4">
            <Field label="Current password">
              <Input
                type="password"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
              />
            </Field>
            <Field label="New password" hint="At least 10 characters.">
              <Input
                type="password"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                type="password"
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              />
            </Field>

            {passwordError && (
              <p className="text-sm text-black/70 bg-[#f0f0f1] rounded-xl px-4 py-3">{passwordError}</p>
            )}

            <Button
              onClick={() => void changePassword()}
              disabled={passwordBusy || !passwords.currentPassword || !passwords.newPassword}
            >
              {passwordBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {passwordBusy ? 'Saving…' : 'Update password'}
            </Button>
          </div>
        </Panel>

        {/* Signed in as */}
        <Panel>
          <SectionHeader title="Signed in as" />
          {me ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#f0f0f1] p-5">
                <p className="font-semibold">{me.name || me.email}</p>
                <p className="text-sm text-black/50">{me.email}</p>
                <div className="mt-3">
                  <Badge className={ROLE_META[me.role]?.chip ?? ROLE_META.staff.chip}>
                    {ROLE_META[me.role]?.label ?? me.role}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-black/50">{ROLE_META[me.role]?.blurb}</p>
              <div className="rounded-2xl border border-black/10 p-5 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Keeping the store safe
                </p>
                <ul className="text-sm text-black/55 space-y-1.5 list-disc pl-5">
                  <li>Give every member of staff their own login — never share one.</li>
                  <li>Change the installer password before you go live.</li>
                  <li>Remove an account the moment someone leaves.</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-black/40">Loading your account…</p>
          )}
        </Panel>
      </div>

      {/* Staff */}
      <Panel pad={false}>
        <div className="px-6 lg:px-7 pt-6 lg:pt-7">
          <SectionHeader
            title="Staff accounts"
            sub={isAdmin ? 'Add a colleague or change what they can do' : 'Only an admin can change these'}
            action={
              isAdmin ? (
                <Button size="sm" onClick={() => setInviting(true)}>
                  <UserPlus className="w-3.5 h-3.5" /> Add staff
                </Button>
              ) : undefined
            }
          />
        </div>

        {loading ? (
          <div className="px-6 lg:px-7 pb-7 flex items-center gap-2 text-sm text-black/40">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading staff…
          </div>
        ) : staff.length === 0 ? (
          <div className="px-6 lg:px-7 pb-7">
            <EmptyState icon={Users} title="No staff accounts" sub="Add an account so the team does not share one login." />
          </div>
        ) : (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id}>
                    <Td className="font-medium">
                      {u.name || '—'}
                      {me?.id === u.id && <span className="text-black/35 text-xs"> (you)</span>}
                    </Td>
                    <Td className="text-black/55">{u.email}</Td>
                    <Td>
                      {isAdmin ? (
                        <div className="max-w-[160px]">
                          <Select
                            value={u.role}
                            onChange={(v) => void changeRole(u, v)}
                            options={ROLE_OPTIONS}
                          />
                        </div>
                      ) : (
                        <Badge className={ROLE_META[u.role]?.chip ?? ROLE_META.staff.chip}>
                          {ROLE_META[u.role]?.label ?? u.role}
                        </Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      {isAdmin && me?.id !== u.id && (
                        <button
                          onClick={() => setRemoving(u)}
                          aria-label={`Remove ${u.email}`}
                          className="w-8 h-8 rounded-full text-black/25 hover:bg-[#f0f0f1] hover:text-black/60 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {/* Invite modal */}
      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        title="Add a staff account"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviting(false)}>Cancel</Button>
            <Button onClick={() => void sendInvite()} disabled={inviteBusy || !invite.email || invite.password.length < 10}>
              {inviteBusy ? 'Creating…' : 'Create account'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name">
            <Input value={invite.name} onChange={(e) => setInvite((i) => ({ ...i, name: e.target.value }))} placeholder="Achieng" />
          </Field>
          <Field label="Email">
            <Input type="email" value={invite.email} onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))} placeholder="achieng@mkurugenzi.co.ke" />
          </Field>
          <Field label="Temporary password" hint="At least 10 characters. Ask them to change it after signing in.">
            <Input type="text" value={invite.password} onChange={(e) => setInvite((i) => ({ ...i, password: e.target.value }))} />
          </Field>
          <Field label="Role">
            <Select value={invite.role} onChange={(v) => setInvite((i) => ({ ...i, role: v }))} options={ROLE_OPTIONS} />
            <p className="text-xs text-black/45 mt-2">{ROLE_META[invite.role]?.blurb}</p>
          </Field>

          {inviteError && (
            <p className="text-sm text-black/70 bg-[#f0f0f1] rounded-xl px-4 py-3">{inviteError}</p>
          )}
        </div>
      </Modal>

      {/* Remove confirm */}
      <Modal
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Remove staff account"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>Keep it</Button>
            <Button variant="danger" onClick={() => void removeStaff()}>Remove access</Button>
          </>
        }
      >
        <p className="text-sm text-black/60">
          {removing?.name || removing?.email} will no longer be able to sign in. Their past orders stay in the
          system — only their access is removed.
        </p>
      </Modal>
    </div>
  );
}
