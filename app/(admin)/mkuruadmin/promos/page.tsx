'use client';

import React from 'react';
import { Tag, Plus, Pencil, Trash2, Copy, Check, Percent, Truck, Banknote } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  Badge, Button, EmptyState, Field, Input, Modal, Panel, SectionHeader, Select,
} from '../components/ui';
import type { Promo, PromoType } from '@/lib/types';
import { KES, daysLeft, formatDate } from '@/lib/seed';

const TYPE_OPTIONS = [
  { value: 'percent', label: 'Percentage off' },
  { value: 'fixed', label: 'Fixed amount off' },
  { value: 'shipping', label: 'Free shipping' },
];

const TYPE_ICON: Record<PromoType, React.ComponentType<{ className?: string }>> = {
  percent: Percent,
  fixed: Banknote,
  shipping: Truck,
};

const blankPromo = (): Promo => ({
  id: '',
  code: '',
  title: '',
  type: 'percent',
  value: 10,
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  used: 0,
  limit: 100,
  active: false,
});

export default function AdminPromosPage() {
  const { promos, save, remove } = useAdmin();
  const [editing, setEditing] = React.useState<Promo | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const live = promos.filter((p) => p.active);
  const ended = promos.filter((p) => !p.active && (daysLeft(p.endsAt) ?? 0) <= 0);

  const submit = async () => {
    if (!editing?.code.trim() || !editing?.title.trim()) return;
    setBusy(true);
    try {
      await save('promos', {
        ...editing,
        id: editing.id || `pr_${Math.random().toString(36).slice(2, 8)}`,
        code: editing.code.trim().toUpperCase(),
      });
      setEditing(null);
      notify('Promotion saved');
    } catch {
      notify('Could not save the promotion');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard can be blocked in an insecure context; still confirm visually.
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 1600);
  };

  const card = (p: Promo) => {
    const Icon = TYPE_ICON[p.type];
    const left = daysLeft(p.endsAt);
    const usage = Math.min(100, (p.used / Math.max(1, p.limit)) * 100);

    return (
      <div key={p.id} className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <button onClick={() => void copy(p.code)} title="Copy code" className="inline-flex items-center gap-2 font-mono text-lg font-bold tracking-tight group">
            {p.code}
            {copied === p.code
              ? <Check className="w-4 h-4 text-black/40" />
              : <Copy className="w-3.5 h-3.5 text-black/25 opacity-0 group-hover:opacity-100 transition-opacity" />}
          </button>
          <Badge className={p.active ? 'bg-[#0d0d0d] text-white' : 'bg-[#f0f0f1] text-black/50'}>
            {p.active ? 'Live' : left !== null && left > 0 ? 'Scheduled' : 'Ended'}
          </Badge>
        </div>

        <p className="text-sm text-black/55 mt-2 flex-1">{p.title}</p>

        <div className="flex items-center gap-2 mt-4">
          <span className="w-8 h-8 rounded-lg bg-[#f0f0f1] flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-[#0d0d0d]" />
          </span>
          <span className="text-sm font-medium">
            {p.type === 'percent' ? `${p.value}% off` : p.type === 'fixed' ? `${KES(p.value)} off` : 'Free delivery'}
          </span>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-black/40 mb-2">
            <span>{p.used} redeemed</span>
            <span>limit {p.limit}</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div className="h-full bg-[#0d0d0d] transition-all duration-500" style={{ width: `${usage}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-5 pt-5 border-t border-black/5">
          <span className="text-xs text-black/40">{formatDate(p.startsAt)} &ndash; {formatDate(p.endsAt)}</span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={p.active ? 'light' : 'dark'}
              onClick={() => void save('promos', { ...p, active: !p.active })}
            >
              {p.active ? 'Pause' : 'Activate'}
            </Button>
            <button onClick={() => setEditing(p)} aria-label="Edit promo" className="w-8 h-8 rounded-full flex items-center justify-center text-black/40 hover:bg-[#f0f0f1] hover:text-[#0d0d0d] transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => void remove('promos', p.id).then(() => notify('Promotion deleted'))} aria-label="Delete promo" className="w-8 h-8 rounded-full flex items-center justify-center text-black/30 hover:bg-[#0d0d0d] hover:text-white transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
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
          <h1 className="section-heading text-3xl sm:text-4xl">Promotions</h1>
          <p className="text-sm text-black/50 mt-1">{live.length} live &middot; {promos.length} total</p>
        </div>
        <Button onClick={() => setEditing(blankPromo())}><Plus className="w-4 h-4" /> New promotion</Button>
      </div>

      {promos.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Tag}
            title="No promotions yet"
            sub="Create a discount code to drive more orders."
            action={<Button onClick={() => setEditing(blankPromo())}><Plus className="w-4 h-4" /> New promotion</Button>}
          />
        </Panel>
      ) : (
        <>
          <section>
            <SectionHeader title="All promotions" sub="Live, scheduled and past campaigns" />
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">{promos.map(card)}</div>
          </section>
          {ended.length > 0 && (
            <Panel>
              <SectionHeader title="Redemption summary" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Metric label="Codes" value={String(promos.length)} />
                <Metric label="Redeemed" value={String(promos.reduce((s, p) => s + p.used, 0))} />
                <Metric label="Live now" value={String(live.length)} />
                <Metric label="Ended" value={String(ended.length)} />
              </div>
            </Panel>
          )}
        </>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id && promos.some((p) => p.id === editing.id) ? 'Edit promotion' : 'New promotion'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void submit()} disabled={busy || !editing?.code.trim() || !editing?.title.trim()}>
              {busy ? 'Saving…' : 'Save promotion'}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Code" hint="Customers type this at checkout.">
                <Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="NAIROBI10" className="font-mono uppercase" />
              </Field>
              <Field label="Discount type">
                <Select value={editing.type} onChange={(v) => setEditing({ ...editing, type: v as PromoType })} options={TYPE_OPTIONS} />
              </Field>
            </div>

            <Field label="Campaign name">
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Nairobi launch week" />
            </Field>

            {editing.type !== 'shipping' && (
              <Field label={editing.type === 'percent' ? 'Discount (%)' : 'Amount off (KES)'}>
                <Input type="number" min={0} max={editing.type === 'percent' ? 100 : undefined} value={editing.value} onChange={(e) => setEditing({ ...editing, value: Math.max(0, Number(e.target.value) || 0) })} />
              </Field>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Starts"><Input type="date" value={editing.startsAt} onChange={(e) => setEditing({ ...editing, startsAt: e.target.value })} /></Field>
              <Field label="Ends"><Input type="date" value={editing.endsAt} onChange={(e) => setEditing({ ...editing, endsAt: e.target.value })} /></Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Redemption limit"><Input type="number" min={0} value={editing.limit} onChange={(e) => setEditing({ ...editing, limit: Math.max(0, Number(e.target.value) || 0) })} /></Field>
              <Field label="Redeemed"><Input type="number" min={0} value={editing.used} onChange={(e) => setEditing({ ...editing, used: Math.max(0, Number(e.target.value) || 0) })} /></Field>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl bg-[#f0f0f1] px-4 py-3">
              <span className="text-sm">Activate immediately</span>
              <button
                type="button"
                onClick={() => setEditing({ ...editing, active: !editing.active })}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${editing.active ? 'bg-[#0d0d0d]' : 'bg-black/15'}`}
              >
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: editing.active ? 22 : 2 }} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f0f0f1] p-5">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-black/45 mt-0.5">{label}</p>
    </div>
  );
}
