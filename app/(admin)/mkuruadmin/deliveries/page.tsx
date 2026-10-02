'use client';

import React from 'react';
import { Truck, Plus, Search as SearchIcon, Package, MapPin, Copy, Check, Download, Phone, Ban, Globe } from 'lucide-react';
import { useAdmin, nextDeliveryStatus } from '../context/AdminContext';
import {
  Badge, Button, EmptyState, Field, Input, Modal, Panel, SearchInput, SectionHeader, Select, Textarea,
} from '../components/ui';
import type { Delivery, DeliveryStatus, PaymentMethod } from '@/lib/types';
import { DELIVERY_FLOW, DELIVERY_STATUS, KES, PAYMENT_LABEL, formatDate } from '@/lib/seed';

const STATUS_OPTIONS = (Object.keys(DELIVERY_STATUS) as DeliveryStatus[]).map((s) => ({
  value: s,
  label: DELIVERY_STATUS[s].label,
}));

const PAYMENT_OPTIONS = (Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => ({
  value: p,
  label: PAYMENT_LABEL[p],
}));

const blankDelivery = (): Delivery => ({
  id: '',
  reference: `MK-${Math.floor(2000 + Math.random() * 900)}`,
  clientId: null,
  clientName: '',
  items: [],
  total: 0,
  status: 'awaiting_payment',
  payment: 'mpesa',
  courier: 'Gokada Express',
  tracking: '',
  address: '',
  placedAt: new Date().toISOString().slice(0, 10),
  window: 'Pending',
  source: 'manual',
  county: '',
  email: '',
  phone: '',
  notes: '',
  mpesaReceipt: '',
});

export default function AdminDeliveriesPage() {
  const { deliveries, clients, products, save, remove } = useAdmin();
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('open');
  const [source, setSource] = React.useState('all');
  const [payment, setPayment] = React.useState('all');
  const [editing, setEditing] = React.useState<Delivery | null>(null);
  const [detail, setDetail] = React.useState<Delivery | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return deliveries.filter((d) => {
      if (status === 'open' && (d.status === 'delivered' || d.status === 'cancelled')) return false;
      if (status !== 'open' && status !== 'all' && d.status !== status) return false;
      if (source !== 'all' && (d.source ?? 'manual') !== source) return false;
      if (payment !== 'all' && d.payment !== payment) return false;
      if (!q) return true;
      // Searching also covers product names, so "which orders had the hoodie?"
      // is one box rather than a per-order hunt.
      return (
        d.reference.toLowerCase().includes(q) ||
        d.clientName.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        d.tracking.toLowerCase().includes(q) ||
        (d.county ?? '').toLowerCase().includes(q) ||
        (d.mpesaReceipt ?? '').toLowerCase().includes(q) ||
        d.items.some((i) => i.name.toLowerCase().includes(q) || i.size.toLowerCase().includes(q))
      );
    });
  }, [deliveries, query, status, source, payment]);

  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of deliveries) map[d.status] = (map[d.status] ?? 0) + 1;
    return map;
  }, [deliveries]);

  const webCount = React.useMemo(() => deliveries.filter((d) => d.source === 'web').length, [deliveries]);

  const advance = async (d: Delivery) => {
    await save('deliveries', { ...d, status: nextDeliveryStatus(d.status) });
    notify(`${d.reference} moved to ${DELIVERY_STATUS[nextDeliveryStatus(d.status)].label}`);
  };

  // Cancelling returns the units to stock, which saveDelivery handles server-side.
  const cancel = async (d: Delivery) => {
    try {
      await save('deliveries', { ...d, status: 'cancelled' });
      notify(`${d.reference} cancelled — stock returned`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not cancel the order');
    }
  };

  const exportCsv = () => {
    const header = ['Reference', 'Date', 'Customer', 'Phone', 'County', 'Items', 'Total', 'Payment', 'Status', 'Source'];
    const rows = filtered.map((d) => [
      d.reference,
      d.placedAt,
      d.clientName,
      d.phone ?? '',
      d.county ?? '',
      d.items.map((i) => `${i.qty}x ${i.name} (${i.size})`).join('; '),
      String(d.total),
      PAYMENT_LABEL[d.payment],
      DELIVERY_STATUS[d.status].label,
      d.source ?? 'manual',
    ]);
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mkurugenzi-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await save('deliveries', {
        ...editing,
        id: editing.id || `d_${Math.random().toString(36).slice(2, 8)}`,
        total: editing.items.reduce((s, i) => s + i.price * i.qty, 0),
      });
      setEditing(null);
      notify('Delivery saved');
    } catch {
      notify('Could not save the delivery');
    } finally {
      setBusy(false);
    }
  };

  const copyTracking = async (tracking: string) => {
    try {
      await navigator.clipboard.writeText(tracking);
    } catch {
      // Ignore clipboard permission errors.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
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
          <h1 className="section-heading text-3xl sm:text-4xl">Orders</h1>
          <p className="text-sm text-black/50 mt-1">
            {deliveries.length} orders &middot; {webCount} from the website &middot; {filtered.length} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={exportCsv}><Download className="w-4 h-4" /> Export CSV</Button>
          <Button onClick={() => setEditing(blankDelivery())}><Plus className="w-4 h-4" /> New order</Button>
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {DELIVERY_FLOW.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className="text-left">
            <div className={`rounded-2xl border p-5 transition-all ${status === s ? 'border-[#0d0d0d] bg-white' : 'border-black/5 bg-white hover:border-black/20'}`}>
              <p className="text-2xl font-bold">{counts[s] ?? 0}</p>
              <p className="text-xs text-black/45 mt-1">{DELIVERY_STATUS[s].label}</p>
            </div>
          </button>
        ))}
      </div>

      <Panel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Order no, customer, product, receipt code" />
          </div>
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'open', label: 'Open orders' },
              { value: 'all', label: 'All statuses' },
              ...STATUS_OPTIONS,
            ]}
          />
          <Select
            value={source}
            onChange={setSource}
            options={[
              { value: 'all', label: 'Any source' },
              { value: 'web', label: 'Website checkout' },
              { value: 'manual', label: 'Phone / in person' },
            ]}
          />
          <Select
            value={payment}
            onChange={setPayment}
            options={[{ value: 'all', label: 'Any payment' }, ...PAYMENT_OPTIONS]}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-xs text-black/40">
            Cancelling an order returns its stock to the shelf automatically.
          </p>
          <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setStatus('open'); setSource('all'); setPayment('all'); }}>
            Reset filters
          </Button>
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel>            <EmptyState
            icon={deliveries.length ? SearchIcon : Truck}
            title={deliveries.length ? 'No orders match' : 'No orders yet'}
            sub={deliveries.length ? 'Try another filter.' : 'Orders placed on the website land here automatically.'}
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => {
            const meta = DELIVERY_STATUS[d.status];
            const canAdvance = d.status !== 'delivered' && d.status !== 'cancelled';
            return (
              <div key={d.id} className="bg-white border border-black/5 rounded-2xl p-5 lg:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-sm">{d.reference}</span>
                      <Badge className={meta.chip} dot>{meta.label}</Badge>
                      <Badge className="bg-[#f0f0f1] text-black/55">{PAYMENT_LABEL[d.payment]}</Badge>
                      {d.source === 'web' && (
                        <Badge className="bg-white text-black/50 border border-black/10">
                          <Globe className="w-3 h-3 mr-1" />Online
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 font-medium">{d.clientName || 'Guest customer'}</p>
                    <p className="text-xs text-black/45 mt-1 flex items-center gap-1.5 flex-wrap">
                      <MapPin className="w-3.5 h-3.5" /> {d.address || 'No address'} &middot; {d.window}
                    </p>
                    {d.phone && (
                      <a
                        href={`https://wa.me/${d.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-black/45 mt-1 inline-flex items-center gap-1.5 hover:text-[#0d0d0d] transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" /> {d.phone}
                      </a>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg">{KES(d.total)}</p>
                    <p className="text-xs text-black/40">{formatDate(d.placedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/5 text-xs text-black/45 flex-wrap">
                  <Package className="w-3.5 h-3.5" />
                  {d.items.length
                    ? d.items.map((i) => `${i.qty}× ${i.name} (${i.size})`).join(', ')
                    : 'No line items recorded'}
                  {d.tracking && d.tracking !== '—' && (
                    <>
                      <span className="mx-1 text-black/15">|</span>
                      <button onClick={() => void copyTracking(d.tracking)} className="inline-flex items-center gap-1 hover:text-[#0d0d0d] transition-colors">
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {d.tracking}
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 flex-wrap">
                  <Button size="sm" variant="ghost" onClick={() => setDetail(d)}>Details</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(d)}>Edit</Button>
                  {d.status !== 'cancelled' && (
                    <Button size="sm" variant="ghost" onClick={() => void cancel(d)}>
                      <Ban className="w-3.5 h-3.5" /> Cancel
                    </Button>
                  )}
                  {canAdvance && (
                    <Button size="sm" onClick={() => void advance(d)}>
                      Move to {DELIVERY_STATUS[nextDeliveryStatus(d.status)].label}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Order ${detail.reference}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetail(null)}>Close</Button>
            <Button onClick={() => { setEditing(detail); setDetail(null); }}>Edit order</Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Info label="Customer" value={detail.clientName || 'Guest'} />
              <Info label="Status" value={DELIVERY_STATUS[detail.status].label} />
              <Info label="Payment" value={PAYMENT_LABEL[detail.payment]} />
              <Info label="Placed" value={formatDate(detail.placedAt)} />
              <Info label="Source" value={detail.source === 'web' ? 'Website checkout' : 'Phone / in person'} />
              <Info label="Phone" value={detail.phone || '—'} />
              <Info label="Email" value={detail.email || '—'} />
              <Info label="County" value={detail.county || '—'} />
              <Info label="M-Pesa receipt" value={detail.mpesaReceipt || '—'} />
              <Info label="Courier" value={detail.courier || '—'} />
              <Info label="Tracking" value={detail.tracking || '—'} />
            </div>

            {detail.notes && (
              <div>
                <p className="text-xs uppercase tracking-wider text-black/40 mb-2">Customer notes</p>
                <p className="text-sm text-black/70">{detail.notes}</p>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-wider text-black/40 mb-3">Delivery address</p>
              <p className="text-sm">{detail.address || '—'}</p>
              <p className="text-xs text-black/45 mt-1">{detail.window}</p>
            </div>

            <div>
              <SectionHeader title="Items" />
              <ul className="space-y-2">
                {detail.items.map((item, i) => (
                  <li key={`${item.name}-${i}`} className="flex items-center justify-between text-sm py-2 border-b border-black/5 last:border-0">
                    <span>{item.qty}× {item.name} <span className="text-black/40">({item.size})</span></span>
                    <span className="font-medium">{KES(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-4 font-bold">
                <span>Total</span>
                <span>{KES(detail.total)}</span>
              </div>
            </div>

            <Button variant="danger" onClick={() => { void remove('deliveries', detail.id).then(() => { setDetail(null); notify('Delivery deleted'); }); }}>
              Delete this delivery
            </Button>
          </div>
        )}
      </Modal>

      {/* Editor */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id && deliveries.some((d) => d.id === editing.id) ? 'Edit delivery' : 'New delivery'}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void submit()} disabled={busy}>{busy ? 'Saving…' : 'Save delivery'}</Button>
          </>
        }
      >
        {editing && <DeliveryEditor draft={editing} clients={clients} onChange={setEditing} products={products} />}
      </Modal>
    </div>
  );
}

function DeliveryEditor({
  draft, clients, onChange, products,
}: {
  draft: Delivery;
  clients: { id: string; name: string }[];
  onChange: (next: Delivery) => void;
  products: { id: string; name: string; price: number; sizes: string[] }[];
}) {
  const patch = (part: Partial<Delivery>) => onChange({ ...draft, ...part });
  const total = draft.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Reference">
          <Input value={draft.reference} onChange={(e) => patch({ reference: e.target.value })} className="font-mono" />
        </Field>
        <Field label="Client">
          <Select
            value={draft.clientId ?? ''}
            onChange={(v) => patch({ clientId: v || null, clientName: clients.find((c) => c.id === v)?.name ?? '' })}
            options={[{ value: '', label: 'Guest customer' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Status">
          <Select value={draft.status} onChange={(v) => patch({ status: v as DeliveryStatus })} options={STATUS_OPTIONS} />
        </Field>
        <Field label="Payment">
          <Select value={draft.payment} onChange={(v) => patch({ payment: v as PaymentMethod })} options={PAYMENT_OPTIONS} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone / WhatsApp" hint="Used to confirm the order and the delivery window.">
          <Input value={draft.phone ?? ''} onChange={(e) => patch({ phone: e.target.value })} placeholder="0712 345 678" />
        </Field>
        <Field label="M-Pesa receipt code" hint="The confirmation code from the customer's SMS.">
          <Input value={draft.mpesaReceipt ?? ''} onChange={(e) => patch({ mpesaReceipt: e.target.value.toUpperCase() })} placeholder="QJG7X2K9LP" className="font-mono" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Courier">
          <Input value={draft.courier} onChange={(e) => patch({ courier: e.target.value })} />
        </Field>
        <Field label="Tracking number">
          <Input value={draft.tracking} onChange={(e) => patch({ tracking: e.target.value })} placeholder="GKE-8827341" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Address">
          <Input value={draft.address} onChange={(e) => patch({ address: e.target.value })} placeholder="Lavington, Nairobi" />
        </Field>
        <Field label="County">
          <Input value={draft.county ?? ''} onChange={(e) => patch({ county: e.target.value })} placeholder="Nairobi" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Delivery window">
          <Input value={draft.window} onChange={(e) => patch({ window: e.target.value })} placeholder="Oct 3, 9am – 12pm" />
        </Field>
        <Field label="Source">
          <Select
            value={draft.source ?? 'manual'}
            onChange={(v) => patch({ source: v as Delivery['source'] })}
            options={[
              { value: 'web', label: 'Website checkout' },
              { value: 'manual', label: 'Phone / in person' },
            ]}
          />
        </Field>
      </div>

      <Field label="Notes" hint="Delivery instructions or anything the rider should know.">
        <Textarea
          rows={3}
          value={draft.notes ?? ''}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Gate code 4471, deliver after 4pm"
        />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-black/50">Items</span>
        </div>

        {draft.items.length === 0 ? (
          <p className="text-sm text-black/35">No items yet — add one from the catalogue below.</p>
        ) : (
          <div className="space-y-3">
            {draft.items.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 sm:col-span-5">
                    <Select
                      value={item.productId ?? ''}
                      onChange={(v) => {
                        const chosen = products.find((p) => p.id === v);
                        patch({
                          items: draft.items.map((it, i) =>
                            i === index
                              ? {
                                  ...it,
                                  productId: v,
                                  name: chosen?.name ?? it.name,
                                  price: chosen?.price ?? it.price,
                                  size: chosen?.sizes.includes(it.size) ? it.size : chosen?.sizes[0] ?? it.size,
                                }
                              : it,
                          ),
                        });
                      }}
                      options={[
                        { value: '', label: 'Custom / not in catalogue' },
                        ...products.map((p) => ({ value: p.id, label: `${p.name} — ${KES(p.price)}` })),
                      ]}
                    />
                  </div>
                  {product ? (
                    <div className="col-span-4 sm:col-span-2">
                      <Select
                        value={item.size}
                        onChange={(v) => patch({ items: draft.items.map((it, i) => (i === index ? { ...it, size: v } : it)) })}
                        options={product.sizes.map((s) => ({ value: s, label: s }))}
                      />
                    </div>
                  ) : (
                    <Input
                      className="col-span-4 sm:col-span-2"
                      value={item.size}
                      placeholder="Size"
                      onChange={(e) => patch({ items: draft.items.map((it, i) => (i === index ? { ...it, size: e.target.value } : it)) })}
                    />
                  )}
                  <Input
                    type="number"
                    min={1}
                    className="col-span-4 sm:col-span-2"
                    value={item.qty}
                    onChange={(e) => patch({ items: draft.items.map((it, i) => (i === index ? { ...it, qty: Math.max(1, Number(e.target.value) || 1) } : it)) })}
                  />
                  <Input
                    type="number"
                    min={0}
                    className="col-span-3 sm:col-span-3"
                    value={item.price}
                    onChange={(e) => patch({ items: draft.items.map((it, i) => (i === index ? { ...it, price: Math.max(0, Number(e.target.value) || 0) } : it)) })}
                  />
                  <button
                    onClick={() => patch({ items: draft.items.filter((_, i) => i !== index) })}
                    aria-label="Remove item"
                    className="col-span-1 w-8 h-8 rounded-full text-black/30 hover:bg-[#f0f0f1] hover:text-[#0d0d0d] transition-colors"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="light"
            onClick={() => {
              const first = products[0];
              if (!first) return;
              patch({
                items: [
                  ...draft.items,
                  { productId: first.id, name: first.name, size: first.sizes[0] ?? 'One size', qty: 1, price: first.price },
                ],
              });
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add catalogue item
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => patch({ items: [...draft.items, { name: '', size: 'One size', qty: 1, price: 0 }] })}
          >
            Custom line
          </Button>
        </div>
        <p className="text-sm text-black/45 mt-4">Order total: <span className="font-semibold text-[#0d0d0d]">{KES(total)}</span></p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f0f0f1] p-4">
      <p className="text-[11px] uppercase tracking-wider text-black/40">{label}</p>
      <p className="text-sm font-medium mt-1 break-words">{value}</p>
    </div>
  );
}
