'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package, Tag, Users, Truck, TrendingUp, AlertTriangle, ArrowRight, Wallet, Boxes, MessageSquare,
} from 'lucide-react';
import { useAdmin, useAdminStats } from './context/AdminContext';
import {
  Badge, Button, Panel, SectionHeader, StatCard, Td, Th, TableWrap, EmptyState,
} from './components/ui';
import {
  DELIVERY_STATUS, KES, PAYMENT_LABEL, daysLeft, formatDate,
} from './lib/data';

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function AdminDashboardPage() {
  const { deliveries, promos, products, clients } = useAdmin();
  const stats = useAdminStats();

  const recent = [...deliveries]
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
    .slice(0, 6);

  const lowStock = [...stats.lowStock]
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const livePromos = promos.filter((p) => p.active);

  const topClients = [...clients].sort((a, b) => b.spent - a.spent).slice(0, 5);

  const maxPromoUse = Math.max(1, ...promos.map((p) => p.limit));

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0d0d0d] flex items-center justify-center shrink-0">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="section-heading text-3xl sm:text-4xl">Good morning, Admin</h1>
          <p className="text-sm text-black/50">Here&rsquo;s what&rsquo;s happening across your store today.</p>
        </div>
        {stats.unreadMessages > 0 && (
          <Link href="/mkuruadmin/messages" className="ml-auto shrink-0">
            <Button variant="light">
              <MessageSquare className="w-4 h-4" />
              {stats.unreadMessages} new {stats.unreadMessages === 1 ? 'message' : 'messages'}
            </Button>
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          label="Revenue delivered"
          value={KES(stats.revenue)}
          sub={`${stats.unitsSold} units sold all time`}
          icon={TrendingUp}
        />
        <StatCard
          label="In the pipeline"
          value={KES(stats.pipeline)}
          sub={`${stats.openDeliveries} open deliveries`}
          icon={Wallet}
        />
        <StatCard
          label="Active products"
          value={`${stats.activeProducts}/${products.length}`}
          sub={`${stats.lowStockCount} low on stock`}
          icon={Boxes}
        />
        <StatCard
          label="Clients"
          value={stats.clients}
          sub={`${stats.vipClients} VIP accounts`}
          icon={Users}
          tone="dark"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent deliveries */}
        <Panel className="xl:col-span-2" pad={false}>
          <div className="px-6 lg:px-7 pt-6 lg:pt-7">
            <SectionHeader
              title="Recent deliveries"
              sub="Latest orders placed across all channels"
              action={
                <Link href="/mkuruadmin/deliveries">
                  <Button variant="light" size="sm">
                    Manage <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              }
            />
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Truck} title="No deliveries yet" sub="Orders will appear here." />
          ) : (
            <TableWrap>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/5">
                    <Th>Order</Th>
                    <Th>Client</Th>
                    <Th>Total</Th>
                    <Th>Payment</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((d) => {
                    const meta = DELIVERY_STATUS[d.status];
                    return (
                      <tr key={d.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                        <Td className="font-medium whitespace-nowrap">{d.reference}</Td>
                        <Td className="text-black/60">{d.clientName}</Td>
                        <Td className="font-medium whitespace-nowrap">{KES(d.total)}</Td>
                        <Td className="text-black/50 whitespace-nowrap">{PAYMENT_LABEL[d.payment]}</Td>
                        <Td>
                          <Badge className={meta.chip} dot>{meta.label}</Badge>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Panel>

        {/* Side rail */}
        <div className="space-y-6">
          <Panel>
            <SectionHeader title="Low stock" sub="Act before these sell out" />
            {lowStock.length === 0 ? (
              <p className="text-sm text-black/40">Everything is well stocked.</p>
            ) : (
              <ul className="space-y-3">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <img
                      src={p.img}
                      alt={p.name}
                      className="h-10 w-10 rounded-lg object-cover bg-[#f0f0f1] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <div className="h-1 rounded-full bg-black/10 mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-[#0d0d0d]"
                          style={{ width: `${Math.min(100, (p.stock / 20) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <Badge className="bg-[#f0f0f1] text-black/60">{p.stock} left</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/mkuruadmin/products" className="inline-block mt-5">
              <Button variant="ghost" size="sm" className="w-full">
                <AlertTriangle className="w-3.5 h-3.5" /> Restock products
              </Button>
            </Link>
          </Panel>

          <Panel>
            <SectionHeader
              title="Promotions"
              action={
                <Link href="/mkuruadmin/promos" className="text-xs font-medium text-black/50 hover:text-[#0d0d0d] transition-colors">
                  View all
                </Link>
              }
            />
            {livePromos.length === 0 ? (
              <p className="text-sm text-black/40">No promotions are running.</p>
            ) : (
              <ul className="space-y-4">
                {livePromos.map((p) => {
                  const left = daysLeft(p.endsAt);
                  return (
                    <li key={p.id}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-sm font-semibold">{p.code}</span>
                        <Badge className="bg-[#0d0d0d] text-white">{p.used} used</Badge>
                      </div>
                      <p className="text-xs text-black/45 mt-1">{p.title}</p>
                      <div className="h-1 rounded-full bg-black/10 mt-2 overflow-hidden">
                        <div className="h-full bg-[#0d0d0d]" style={{ width: `${(p.used / maxPromoUse) * 100}%` }} />
                      </div>
                      {left !== null && (
                        <p className="text-[11px] text-black/35 mt-1.5">
                          {left > 0 ? `Ends in ${left} days` : 'Expired'}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel>
          <SectionHeader
            title="Top clients"
            sub="By lifetime spend"
            action={
              <Link href="/mkuruadmin/clients" className="text-xs font-medium text-black/50 hover:text-[#0d0d0d] transition-colors">
                View all
              </Link>
            }
          />
          <ul className="space-y-1">
            {topClients.map((c, i) => (
              <motion.li
                key={c.id}
                variants={fade}
                initial="hidden"
                animate="show"
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 py-2.5 border-b border-black/5 last:border-0"
              >
                <span className="w-6 text-xs font-bold text-black/25">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-black/40">{c.orders} orders &middot; {c.city}</p>
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">{KES(c.spent)}</span>
              </motion.li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <SectionHeader title="Store health" />
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#f0f0f1] p-5">
              <Tag className="w-4 h-4 text-black/40 mb-2" />
              <p className="text-xl font-bold">{livePromos.length}</p>
              <p className="text-xs text-black/45">Live promos</p>
            </div>
            <div className="rounded-xl bg-[#f0f0f1] p-5">
              <Truck className="w-4 h-4 text-black/40 mb-2" />
              <p className="text-xl font-bold">{stats.openDeliveries}</p>
              <p className="text-xs text-black/45">Open deliveries</p>
            </div>
            <div className="rounded-xl bg-[#f0f0f1] p-5">
              <Wallet className="w-4 h-4 text-black/40 mb-2" />
              <p className="text-xl font-bold">{KES(stats.outstandingTotal)}</p>
              <p className="text-xs text-black/45">Unpaid orders</p>
            </div>
            <div className="rounded-xl bg-[#0d0d0d] text-white p-5">
              <TrendingUp className="w-4 h-4 text-white/50 mb-2" />
              <p className="text-xl font-bold">{stats.unitsSold}</p>
              <p className="text-xs text-white/45">Units sold</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
