'use client';

import React from 'react';
import {
  Users, Plus, Pencil, Trash2, Search as SearchIcon, Phone, Mail, MapPin, ShoppingBag,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  Badge, Button, EmptyState, Field, Input, Modal, Panel, SearchInput, Select, Textarea,
} from '../components/ui';
import type { Client, ClientTier } from '@/lib/types';
import { KES, PAYMENT_LABEL, formatDate } from '@/lib/seed';

const TIER_OPTIONS = [
  { value: 'vip', label: 'VIP' },
  { value: 'regular', label: 'Regular' },
  { value: 'new', label: 'New' },
];

const TIER_CHIP: Record<ClientTier, string> = {
  vip: 'bg-[#0d0d0d] text-white',
  regular: 'bg-[#f0f0f1] text-black/60',
  new: 'bg-white text-black/45 border border-black/10',
};

const blankClient = (): Client => ({
  id: '',
  name: '',
  phone: '',
  email: '',
  city: 'Nairobi',
  orders: 0,
  spent: 0,
  tier: 'new',
  joinedAt: new Date().toISOString().slice(0, 10),
  notes: '',
});

export default function AdminClientsPage() {
  const { clients, deliveries, save, remove } = useAdmin();
  const [query, setQuery] = React.useState('');
  const [tier, setTier] = React.useState('all');
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [detail, setDetail] = React.useState<Client | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (tier !== 'all' && c.tier !== tier) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }, [clients, query, tier]);

  const history = React.useMemo(() => {
    if (!detail) return [];
    return deliveries
      .filter((d) => d.clientId === detail.id || d.clientName === detail.name)
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  }, [detail, deliveries]);

  const totalSpent = clients.reduce((s, c) => s + c.spent, 0);

  const submit = async () => {
    if (!editing?.name.trim()) return;
    setBusy(true);
    try {
      await save('clients', {
        ...editing,
        id: editing.id || `c_${Math.random().toString(36).slice(2, 8)}`,
      });
      setEditing(null);
      notify('Client saved');
    } catch {
      notify('Could not save the client');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full bg-[#0d0d0d] text-white text-sm shadow-[0_18px_40px_-20px_rgba(0,0,0,0.5)]">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-heading text-3xl sm:text-4xl">Clients</h1>
          <p className="text-sm text-black/50 mt-1">
            {clients.length} clients &middot; {KES(totalSpent)} lifetime value
          </p>
        </div>
        <Button onClick={() => setEditing(blankClient())}><Plus className="w-4 h-4" /> New client</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Total clients" value={String(clients.length)} />
        <Metric label="VIP" value={String(clients.filter((c) => c.tier === 'vip').length)} />
        <Metric label="Repeat buyers" value={String(clients.filter((c) => c.orders > 1).length)} />
        <Metric label="Average spend" value={KES(Math.round(totalSpent / Math.max(1, clients.length)))} />
      </div>

      <Panel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, phone" />
          <Select
            value={tier}
            onChange={setTier}
            options={[{ value: 'all', label: 'All tiers' }, ...TIER_OPTIONS]}
          />
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel>
          <EmptyState
            icon={clients.length ? SearchIcon : Users}
            title={clients.length ? 'No clients match' : 'No clients yet'}
            sub={clients.length ? 'Try a different search or filter.' : 'Add your first customer.'}
            action={!clients.length && <Button onClick={() => setEditing(blankClient())}><Plus className="w-4 h-4" /> New client</Button>}
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-black/40 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> {c.city}
                  </p>
                </div>
                <Badge className={TIER_CHIP[c.tier]}>{c.tier.toUpperCase()}</Badge>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-black/50">
                {c.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-[#0d0d0d] transition-colors">
                      {c.phone}
                    </a>
                  </p>
                )}
                {c.email && (
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <a href={`mailto:${c.email}`} className="truncate hover:text-[#0d0d0d] transition-colors">{c.email}</a>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-black/5">
                <div>
                  <p className="text-sm font-bold">{c.orders}</p>
                  <p className="text-[11px] text-black/40">Orders</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{KES(c.spent)}</p>
                  <p className="text-[11px] text-black/40">Spent</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <IconBtn label="Edit" onClick={() => setEditing(c)}><Pencil className="w-3.5 h-3.5" /></IconBtn>
                  <IconBtn label="Delete" danger onClick={() => void remove('clients', c.id).then(() => notify('Client deleted'))}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconBtn>
                </div>
              </div>

              <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setDetail(c)}>
                View history
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Detail */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        footer={<Button variant="ghost" onClick={() => setDetail(null)}>Close</Button>}
      >
        {detail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Lifetime spend" value={KES(detail.spent)} />
              <Metric label="Orders" value={String(detail.orders)} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Phone" value={detail.phone || '—'} />
              <Info label="Email" value={detail.email || '—'} />
              <Info label="City" value={detail.city || '—'} />
              <Info label="Client since" value={formatDate(detail.joinedAt)} />
            </div>

            {detail.notes && (
              <div>
                <p className="text-xs uppercase tracking-wider text-black/40 mb-2">Notes</p>
                <p className="text-sm leading-relaxed">{detail.notes}</p>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-wider text-black/40 mb-3">Order history</p>
              {history.length === 0 ? (
                <p className="text-sm text-black/35">No orders recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 text-sm py-2.5 border-b border-black/5 last:border-0">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold">{d.reference}</p>
                        <p className="text-xs text-black/40">
                          {formatDate(d.placedAt)} &middot; {PAYMENT_LABEL[d.payment]}
                        </p>
                      </div>
                      <span className="font-medium whitespace-nowrap">{KES(d.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button variant="ghost" onClick={() => { setEditing(detail); setDetail(null); }} className="w-full">
              <ShoppingBag className="w-4 h-4" /> Edit client
            </Button>
          </div>
        )}
      </Modal>

      {/* Editor */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id && clients.some((c) => c.id === editing.id) ? 'Edit client' : 'New client'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void submit()} disabled={busy || !editing?.name.trim()}>
              {busy ? 'Saving…' : 'Save client'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-5">
            <Field label="Full name">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Achieng Odhiambo" />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone">
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="+254 7…" />
              </Field>
              <Field label="Email">
                <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="name@example.com" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="City">
                <Input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
              </Field>
              <Field label="Tier">
                <Select value={editing.tier} onChange={(v) => setEditing({ ...editing, tier: v as ClientTier })} options={TIER_OPTIONS} />
              </Field>
              <Field label="Client since">
                <Input type="date" value={editing.joinedAt} onChange={(e) => setEditing({ ...editing, joinedAt: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Orders">
                <Input type="number" min={0} value={editing.orders} onChange={(e) => setEditing({ ...editing, orders: Math.max(0, Number(e.target.value) || 0) })} />
              </Field>
              <Field label="Lifetime spend (KES)">
                <Input type="number" min={0} value={editing.spent} onChange={(e) => setEditing({ ...editing, spent: Math.max(0, Number(e.target.value) || 0) })} />
              </Field>
            </div>

            <Field label="Notes" hint="Anything the team should know about this customer.">
              <Textarea rows={3} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f0f0f1] p-5">
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-black/45 mt-0.5">{label}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-black/40">{label}</p>
      <p className="mt-1 break-words">{value}</p>
    </div>
  );
}

function IconBtn({
  children, label, onClick, danger = false,
}: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${danger ? 'text-black/30 hover:bg-[#0d0d0d] hover:text-white' : 'text-black/40 hover:bg-[#f0f0f1] hover:text-[#0d0d0d]'}`}
    >
      {children}
    </button>
  );
}
