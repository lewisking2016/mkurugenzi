'use client';

import React from 'react';
import {
  BarChart3, Download, TrendingUp, TrendingDown, Package, AlertTriangle, Award, Clock,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Badge, Button, EmptyState, Panel, SectionHeader, StatCard, TableWrap, Td, Th } from '../components/ui';
import { KES, formatDate, totalStock } from '@/lib/seed';
import type { Delivery } from '@/lib/types';

type Period = '7' | '30' | '90' | '365' | 'all';

const PERIODS: { value: Period; label: string; days: number }[] = [
  { value: '7', label: 'Last 7 days', days: 7 },
  { value: '30', label: 'Last 30 days', days: 30 },
  { value: '90', label: 'Last 90 days', days: 90 },
  { value: '365', label: 'Last 12 months', days: 365 },
  { value: 'all', label: 'All time', days: Number.POSITIVE_INFINITY },
];

/** Orders that represent real money in the door, not money still to collect. */
const isCounted = (d: Delivery) => d.status !== 'cancelled';

const dayKey = (iso: string) => (iso || '').slice(0, 10);

function inPeriod(iso: string, days: number) {
  if (!Number.isFinite(days)) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= Date.now() - days * 86_400_000;
}

interface ProductLine {
  units: number;
  revenue: number;
}

export default function AdminReportsPage() {
  const { products, deliveries, settings } = useAdmin();
  const [period, setPeriod] = React.useState<Period>('30');
  const [toast, setToast] = React.useState<string | null>(null);

  const days = PERIODS.find((p) => p.value === period)?.days ?? 30;
  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? 'Last 30 days';

  const stats = React.useMemo(() => {
    const live = deliveries.filter(isCounted);
    const current = live.filter((d) => inPeriod(d.placedAt, days));
    // The comparison window is the same length immediately before this one, so
    // "up 24%" means something rather than comparing a week against a year.
    const previous =
      Number.isFinite(days)
        ? live.filter((d) => {
            const t = new Date(d.placedAt).getTime();
            if (Number.isNaN(t)) return false;
            return t >= Date.now() - days * 2 * 86_400_000 && t < Date.now() - days * 86_400_000;
          })
        : [];

    const revenue = current.reduce((sum, d) => sum + d.total, 0);
    const prevRevenue = previous.reduce((sum, d) => sum + d.total, 0);
    const units = current.reduce(
      (sum, d) => sum + d.items.reduce((s, i) => s + i.qty, 0),
      0,
    );
    const delivered = current.filter((d) => d.status === 'delivered');
    const awaiting = current.filter((d) => d.status === 'awaiting_payment');

    // Best sellers are measured from real orders. Older orders predate the
    // `productId` on line items, so fall back to matching the product name —
    // otherwise the same hoodie appears twice in the ranking.
    const idByName = new Map(products.map((p) => [p.name.trim().toLowerCase(), p.id]));
    const lines = new Map<string, ProductLine>();
    for (const d of current) {
      for (const item of d.items) {
        const key = item.productId ?? idByName.get(item.name.trim().toLowerCase()) ?? item.name;
        const entry = lines.get(key) ?? { units: 0, revenue: 0 };
        entry.units += item.qty;
        entry.revenue += item.price * item.qty;
        lines.set(key, entry);
      }
    }
    const bestSellers = [...lines.entries()]
      .map(([key, line]) => ({ key, ...line }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 8);

    const lifetimeBest = [...products]
      .filter((p) => p.status === 'active')
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 8);

    // Slow movers: active products that are still in stock but have not sold.
    const slowMovers = products
      .filter((p) => p.status === 'active' && p.sold === 0 && totalStock(p) > 0)
      .sort((a, b) => totalStock(b) - totalStock(a));

    // A simple daily revenue series for the sparkline-style bar chart.
    const buckets = Number.isFinite(days) ? Math.min(days, 30) : 30;
    const series: { label: string; value: number }[] = [];
    for (let i = buckets - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dayKey(d.toISOString());
      series.push({
        label: key,
        value: current.filter((o) => dayKey(o.placedAt) === key).reduce((sum, o) => sum + o.total, 0),
      });
    }

    const byCounty = new Map<string, { orders: number; revenue: number }>();
    for (const d of current) {
      const key = d.county || 'Not recorded';
      const entry = byCounty.get(key) ?? { orders: 0, revenue: 0 };
      entry.orders += 1;
      entry.revenue += d.total;
      byCounty.set(key, entry);
    }

    const byPayment = new Map<string, number>();
    for (const d of current) byPayment.set(d.payment, (byPayment.get(d.payment) ?? 0) + 1);

    return {
      revenue,
      prevRevenue,
      orders: current.length,
      prevOrders: previous.length,
      units,
      averageOrder: current.length ? Math.round(revenue / current.length) : 0,
      delivered: delivered.length,
      awaiting: awaiting.length,
      awaitingTotal: awaiting.reduce((s, d) => s + d.total, 0),
      bestSellers,
      lifetimeBest,
      slowMovers,
      series,
      counties: [...byCounty.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 6),
      payments: [...byPayment.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [deliveries, products, days]);

  const delta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // "+100%" against an empty previous period is technically true but reads like
  // ordinary growth, so say plainly that there is nothing to compare against.
  const trendLabel = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 'No orders in the previous period' : 'No change';
    const pct = delta(current, previous);
    return `${pct >= 0 ? '+' : ''}${pct}% vs previous period`;
  };

  const maxBar = Math.max(1, ...stats.series.map((s) => s.value));

  const exportCsv = () => {
    const lines = [
      ['Mkurugenzi sales report'],
      ['Period', periodLabel],
      ['Generated', new Date().toISOString()],
      [],
      ['Metric', 'Value'],
      ['Revenue', stats.revenue],
      ['Orders', stats.orders],
      ['Units sold', stats.units],
      ['Average order value', stats.averageOrder],
      [],
      ['Best sellers', 'Units', 'Revenue'],
      ...stats.bestSellers.map((s) => [s.key, s.units, s.revenue]),
      [],
      ['Slow movers (no sales, still in stock)', 'Units in stock'],
      ...stats.slowMovers.map((p) => [p.name, totalStock(p)]),
    ];
    const csv = lines
      .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mkurugenzi-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('Report exported');
    setTimeout(() => setToast(null), 2400);
  };

  const nameFor = (key: string) => products.find((p) => p.id === key)?.name ?? key;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full bg-[#0d0d0d] text-white text-sm shadow-[0_18px_40px_-20px_rgba(0,0,0,0.5)]">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-heading text-3xl sm:text-4xl">Reports</h1>
          <p className="text-sm text-black/50 mt-1">{periodLabel} &middot; {stats.orders} orders</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-full bg-white border border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:border-black/40"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <Button variant="ghost" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Revenue"
          value={KES(stats.revenue)}
          sub={trendLabel(stats.revenue, stats.prevRevenue)}
          icon={BarChart3}
          tone="dark"
        />
        <StatCard
          label="Orders"
          value={stats.orders}
          sub={trendLabel(stats.orders, stats.prevOrders)}
          icon={Package}
        />
        <StatCard
          label="Average order"
          value={KES(stats.averageOrder)}
          sub={`${stats.units} units sold`}
          icon={Award}
        />
        <StatCard
          label="Awaiting payment"
          value={KES(stats.awaitingTotal)}
          sub={`${stats.awaiting} orders to chase`}
          icon={Clock}
        />
      </div>

      {/* Daily revenue */}
      <Panel>
        <SectionHeader title="Revenue by day" sub={periodLabel} />
        <div className="flex items-end gap-1 h-40">
          {stats.series.map((point, i) => (
            <div key={point.label} className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className="w-full rounded-t-md bg-[#0d0d0d] min-h-[2px] transition-all"
                style={{ height: `${Math.max(2, (point.value / maxBar) * 100)}%` }}
                title={`${formatDate(point.label)} — ${KES(point.value)}`}
              />
              <span className="text-[9px] text-black/30">{i % 5 === 0 ? point.label.slice(5) : ''}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best sellers in the period */}
        <Panel>
          <SectionHeader title="Best sellers" sub="From orders placed in this period" />
          {stats.bestSellers.length === 0 ? (
            <p className="text-sm text-black/35">No orders in this period yet.</p>
          ) : (
            <TableWrap>
              <table>
                <thead>
                  <tr><Th>Product</Th><Th className="text-right">Units</Th><Th className="text-right">Revenue</Th></tr>
                </thead>
                <tbody>
                  {stats.bestSellers.map((row) => (
                    <tr key={row.key}>
                      <Td className="font-medium">{nameFor(row.key)}</Td>
                      <Td className="text-right">{row.units}</Td>
                      <Td className="text-right font-semibold">{KES(row.revenue)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>

        {/* Lifetime ranking */}
        <Panel>
          <SectionHeader title="Top sellers all time" sub="Ranked by lifetime units sold" />
          <TableWrap>
            <table>
              <thead>
                <tr><Th>Product</Th><Th className="text-right">Sold</Th><Th className="text-right">In stock</Th></tr>
              </thead>
              <tbody>
                {stats.lifetimeBest.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-medium">{p.name}</Td>
                    <Td className="text-right">{p.sold}</Td>
                    <Td className="text-right">
                      <span className={totalStock(p) <= (settings.lowStockAlert || 10) ? 'text-black/60 font-medium' : ''}>
                        {totalStock(p)}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel>
          <SectionHeader title="Where orders come from" sub="By county" />
          {stats.counties.length === 0 ? (
            <p className="text-sm text-black/35">No orders in this period yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.counties.map(([county, data]) => {
                const share = stats.revenue ? Math.round((data.revenue / stats.revenue) * 100) : 0;
                return (
                  <div key={county}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{county}</span>
                      <span className="text-black/45">{data.orders} orders &middot; {KES(data.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#f0f0f1] overflow-hidden">
                      <div className="h-full bg-[#0d0d0d] rounded-full" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel>
          <SectionHeader title="Payment mix" sub="How customers paid" />
          {stats.payments.length === 0 ? (
            <p className="text-sm text-black/35">No orders in this period yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {stats.payments.map(([method, count]) => (
                <div key={method} className="rounded-2xl bg-[#f0f0f1] px-5 py-4">
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs text-black/45 capitalize">{method}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Slow movers */}
      <Panel>
        <SectionHeader
          title="Slow movers"
          sub="Active products with stock sitting unsold — these are the ones to discount or bundle"
        />
        {stats.slowMovers.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Everything is selling" sub="No active product is sitting at zero sales." />
        ) : (
          <div className="space-y-2">
            {stats.slowMovers.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 py-3 border-b border-black/5 last:border-0">
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-black/40">{KES(p.price)} &middot; {p.category}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className="bg-[#f0f0f1] text-black/60">{totalStock(p)} unsold</Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-black/40">
                    <TrendingDown className="w-3.5 h-3.5" /> 0 sold
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {stats.awaiting > 0 && (
        <div className="rounded-2xl bg-[#f0f0f1] p-6 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{stats.awaiting} orders are still awaiting payment</p>
            <p className="text-sm text-black/50 mt-1">
              Worth {KES(stats.awaitingTotal)}. Match each one against its M-Pesa confirmation code on the
              Orders screen, or chase the customer on WhatsApp.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
