'use client';

import React from 'react';
import {
  Truck, Database, Save, RefreshCw, MessageCircle, Phone, Mail,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  Button, Field, Input, Panel, SectionHeader, Toggle,
} from '../components/ui';
import type { SystemSettings } from '@/lib/types';

export default function AdminSystemPage() {
  const { settings, saveSettings, reload, storage } = useAdmin();
  const [draft, setDraft] = React.useState<SystemSettings>(settings);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [resetting, setResetting] = React.useState(false);

  React.useEffect(() => { setDraft(settings); }, [settings]);

  const patch = (part: Partial<SystemSettings>) => setDraft((d) => ({ ...d, ...part }));

  const save = async () => {
    setBusy(true);
    try {
      await saveSettings(draft);
      setToast('Settings saved');
    } catch {
      setToast('Could not save settings');
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 2600);
    }
  };

  const resetStore = async () => {
    setResetting(true);
    await reload();
    setResetting(false);
    setToast('Reloaded from the database');
    setTimeout(() => setToast(null), 2600);
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
          <h1 className="section-heading text-3xl sm:text-4xl">System</h1>
          <p className="text-sm text-black/50 mt-1">Store details, delivery rules and payments.</p>
        </div>
        <Button onClick={() => void save()} disabled={busy}>
          <Save className="w-4 h-4" /> {busy ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {/* Storage */}
      <Panel className={storage === 'mysql' ? '' : 'border-dashed'}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="w-10 h-10 rounded-xl bg-[#f0f0f1] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <p className="font-medium">
                {storage === 'mysql' ? 'Connected to MySQL' : 'Using the local file store'}
              </p>
              <p className="text-sm text-black/45 mt-1">
                {storage === 'mysql'
                  ? 'Changes are saved to your server database.'
                  : 'Set DB_HOST and friends in .env.local, then run npm run db:setup to switch to MySQL.'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void resetStore()} disabled={resetting}>
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} /> Reload
          </Button>
        </div>
      </Panel>

      {/* Store */}
      <Panel>
        <SectionHeader title="Store details" sub="Shown on invoices, receipts and the footer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Store name">
            <Input value={draft.storeName} onChange={(e) => patch({ storeName: e.target.value })} />
          </Field>
          <Field label="Currency code">
            <Input value={draft.currency} onChange={(e) => patch({ currency: e.target.value })} />
          </Field>
          <Field label="Public email">
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-black/25" />
              <Input className="pl-11" value={draft.email} onChange={(e) => patch({ email: e.target.value })} />
            </div>
          </Field>
          <Field label="Phone">
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-black/25" />
              <Input className="pl-11" value={draft.phone} onChange={(e) => patch({ phone: e.target.value })} />
            </div>
          </Field>
          <Field label="WhatsApp number" hint="Format digits only, e.g. 254716265661">
            <div className="relative">
              <MessageCircle className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-black/25" />
              <Input
                className="pl-11"
                value={draft.whatsapp}
                onChange={(e) => patch({ whatsapp: e.target.value.replace(/[^0-9]/g, '') })}
              />
            </div>
          </Field>
          <Field label="Low stock alert" hint="Warn the team when stock drops below this.">
            <Input type="number" min={0} value={draft.lowStockAlert} onChange={(e) => patch({ lowStockAlert: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
        </div>
      </Panel>

      {/* Delivery */}
      <Panel>
        <SectionHeader title="Delivery" sub="Fees used at checkout" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Field label="Free delivery over">
            <Input type="number" min={0} value={draft.freeDeliveryThreshold} onChange={(e) => patch({ freeDeliveryThreshold: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
          <Field label="Fee — Nairobi">
            <Input type="number" min={0} value={draft.deliveryFeeNairobi} onChange={(e) => patch({ deliveryFeeNairobi: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
          <Field label="Fee — outside Nairobi">
            <Input type="number" min={0} value={draft.deliveryFeeOutside} onChange={(e) => patch({ deliveryFeeOutside: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
        </div>
      </Panel>

      {/* Payments */}
      <Panel>
        <SectionHeader title="Payments" sub="How customers pay at checkout" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="M-Pesa paybill" hint="Customers enter this on the STK prompt.">
            <Input value={draft.mpesaPaybill} onChange={(e) => patch({ mpesaPaybill: e.target.value })} />
          </Field>
          <div className="flex items-end pb-1">
            <Toggle
              checked={draft.autoConfirmMpesa}
              onChange={(v) => patch({ autoConfirmMpesa: v })}
              label="Auto-confirm M-Pesa payments"
              hint="Mark an order as paid once the callback arrives."
            />
          </div>
        </div>
      </Panel>

      {/* Notifications */}
      <Panel>
        <SectionHeader title="Notifications" sub="What the team gets alerted about" />
        <div className="divide-y divide-black/5">
          <Toggle
            checked={draft.orderNotifications}
            onChange={(v) => patch({ orderNotifications: v })}
            label="New order alerts"
            hint="Notify staff the moment an order is placed."
          />
          <Toggle
            checked={draft.weeklyReport}
            onChange={(v) => patch({ weeklyReport: v })}
            label="Weekly sales report"
            hint="A Monday summary of revenue and top sellers."
          />
        </div>
      </Panel>

      {/* Deploy notes */}
      <Panel>
        <SectionHeader title="Deployment" sub="Works the same on cPanel and a VPS" />
        <ol className="space-y-3 text-sm text-black/60 list-decimal list-inside">
          <li>Create a MySQL/MariaDB database and a user with full privileges.</li>
          <li>
            Set <code className="font-mono text-xs bg-[#f0f0f1] px-1.5 py-0.5 rounded">DB_HOST</code>,{' '}
            <code className="font-mono text-xs bg-[#f0f0f1] px-1.5 py-0.5 rounded">DB_USER</code>,{' '}
            <code className="font-mono text-xs bg-[#f0f0f1] px-1.5 py-0.5 rounded">DB_PASSWORD</code> and{' '}
            <code className="font-mono text-xs bg-[#f0f0f1] px-1.5 py-0.5 rounded">DB_NAME</code> in the host environment.
          </li>
          <li>
            Run <code className="font-mono text-xs bg-[#f0f0f1] px-1.5 py-0.5 rounded">npm run db:setup</code> once to create tables and your admin user.
          </li>
          <li>
            Point the app at Node 20+ and run{' '}
            <code className="font-mono text-xs bg-[#f0f0f1] px-1.5 py-0.5 rounded">npm run build && npm start</code>.
          </li>
        </ol>
        <p className="text-xs text-black/40 mt-5 flex items-center gap-2">
          <Truck className="w-3.5 h-3.5" /> Set <code className="font-mono">SESSION_SECRET</code> to a long random string.
        </p>
      </Panel>
    </div>
  );
}
