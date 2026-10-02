'use client';

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import type {
  Client, Delivery, DeliveryStatus, Message, Product, Promo, SystemSettings,
} from '@/lib/types';

const RESOURCES = ['products', 'promos', 'clients', 'deliveries', 'messages'] as const;
type Resource = (typeof RESOURCES)[number];

interface Snapshot {
  products: Product[];
  promos: Promo[];
  clients: Client[];
  deliveries: Delivery[];
  messages: Message[];
  settings: SystemSettings;
  storage: 'mysql' | 'local-file';
}

interface AdminContextValue extends Snapshot {
  status: 'loading' | 'ready' | 'error' | 'unauthenticated';
  error: string | null;
  reload: () => Promise<void>;
  save: (resource: Resource, record: unknown) => Promise<void>;
  remove: (resource: Resource, id: string) => Promise<void>;
  saveSettings: (next: SystemSettings) => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

const EMPTY_SETTINGS: SystemSettings = {
  storeName: 'Mkurugenzi',
  email: '',
  phone: '',
  whatsapp: '',
  currency: 'KES',
  freeDeliveryThreshold: 0,
  deliveryFeeNairobi: 0,
  deliveryFeeOutside: 0,
  lowStockAlert: 10,
  mpesaPaybill: '',
  autoConfirmMpesa: false,
  orderNotifications: false,
  weeklyReport: false,
};

/** Placeholder so the shell can render its loading state without a null context. */
const EMPTY: Snapshot = {
  products: [],
  promos: [],
  clients: [],
  deliveries: [],
  messages: [],
  settings: EMPTY_SETTINGS,
  storage: 'local-file',
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'same-origin',
  });

  if (response.status === 401) throw new Error('unauthenticated');

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error || `Request failed (${response.status})`);
  }
  return payload as T;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<AdminContextValue['status']>('loading');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await request<Snapshot>('/api/admin/snapshot');
      setSnapshot(data);
      setStatus('ready');
      setError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load the store';
      if (message === 'unauthenticated') setStatus('unauthenticated');
      else {
        setStatus('error');
        setError(message);
      }
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async (resource: Resource, record: unknown) => {
    const fields = (record ?? {}) as { id?: string } & Record<string, unknown>;
    const id = fields.id;
    // Optimistic update keeps the tables responsive while the write is in flight.
    setSnapshot((prev) => {
      if (!prev) return prev;
      const list = prev[resource] as { id: string }[];
      const exists = list.some((item) => item.id === id);
      return {
        ...prev,
        [resource]: exists
          ? list.map((item) => (item.id === id ? { ...item, ...fields } : item))
          : [{ ...fields }, ...list],
      } as Snapshot;
    });

    try {
      await request(
        id ? `/api/admin/${resource}/${encodeURIComponent(String(id))}` : `/api/admin/${resource}`,
        { method: id ? 'PUT' : 'POST', body: JSON.stringify(record) },
      );
    } catch (e) {
      // Roll back to the server's truth if the write failed.
      await reload();
      throw e;
    }
  }, [reload]);

  const remove = useCallback(async (resource: Resource, id: string) => {
    const before = snapshot;
    setSnapshot((prev) =>
      prev
        ? ({ ...prev, [resource]: (prev[resource] as { id: string }[]).filter((i) => i.id !== id) } as Snapshot)
        : prev,
    );
    try {
      await request(`/api/admin/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {
      if (before) setSnapshot(before);
      await reload();
      throw e;
    }
  }, [snapshot, reload]);

  const persistSettings = useCallback(async (next: SystemSettings) => {
    const before = snapshot;
    setSnapshot((prev) => (prev ? { ...prev, settings: next } : prev));
    try {
      await request('/api/admin/settings', { method: 'PUT', body: JSON.stringify(next) });
    } catch (e) {
      if (before) setSnapshot(before);
      throw e;
    }
  }, [snapshot]);

  const value = useMemo<AdminContextValue>(() => {
    const data = snapshot ?? EMPTY;
    return {
      ...data,
      status,
      error,
      reload,
      save,
      remove,
      saveSettings: persistSettings,
    };
  }, [snapshot, status, error, reload, save, remove, persistSettings]);

  // Children render a loading screen until the snapshot exists, so a null value is safe.
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}

/** Derived numbers for the dashboard, recomputed only when the data changes. */
export function useAdminStats() {
  const { products, promos, clients, deliveries, messages, settings } = useAdmin();
  const lowStockLimit = settings.lowStockAlert || 10;

  return useMemo(() => {
    const revenue = deliveries
      .filter((d) => d.status === 'delivered')
      .reduce((sum, d) => sum + d.total, 0);
    const pipeline = deliveries
      .filter((d) => d.status !== 'delivered' && d.status !== 'cancelled')
      .reduce((sum, d) => sum + d.total, 0);
    const outstanding = deliveries.filter((d) => d.status === 'awaiting_payment');
    const lowStock = products.filter((p) => p.stock <= lowStockLimit && p.status === 'active');

    return {
      revenue,
      pipeline,
      unitsSold: products.reduce((sum, p) => sum + p.sold, 0),
      lowStock,
      lowStockCount: lowStock.length,
      outstanding,
      outstandingTotal: outstanding.reduce((s, d) => s + d.total, 0),
      openDeliveries: deliveries.filter(
        (d) => d.status !== 'delivered' && d.status !== 'cancelled',
      ).length,
      activePromos: promos.filter((p) => p.active).length,
      activeProducts: products.filter((p) => p.status === 'active').length,
      clients: clients.length,
      vipClients: clients.filter((c) => c.tier === 'vip').length,
      unreadMessages: messages.filter((m) => m.status === 'new').length,
    };
  }, [products, promos, clients, deliveries, messages, lowStockLimit]);
}

const FLOW: DeliveryStatus[] = ['awaiting_payment', 'confirmed', 'packed', 'in_transit', 'delivered'];

export function nextDeliveryStatus(status: DeliveryStatus): DeliveryStatus {
  const i = FLOW.indexOf(status);
  return FLOW[Math.min(i + 1, FLOW.length - 1)] ?? status;
}

export function useResource(resource: Resource) {
  const ctx = useAdmin();
  return {
    items: ctx[resource] as { id: string }[],
    save: (record: unknown) => ctx.save(resource, record),
    remove: (id: string) => ctx.remove(resource, id),
  };
}
