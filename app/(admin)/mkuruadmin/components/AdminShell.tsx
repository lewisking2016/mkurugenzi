'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, Tag, Users, Truck, MessageSquare, Settings, ArrowLeft, LogOut, Menu, X, BarChart3, UserCog,
} from 'lucide-react';
import { AdminProvider, useAdmin } from '../context/AdminContext';

const NAV = [
  { name: 'Dashboard', href: '/mkuruadmin', icon: LayoutDashboard },
  { name: 'Orders', href: '/mkuruadmin/deliveries', icon: Truck },
  { name: 'Products', href: '/mkuruadmin/products', icon: Package },
  { name: 'Promotions', href: '/mkuruadmin/promos', icon: Tag },
  { name: 'Clients', href: '/mkuruadmin/clients', icon: Users },
  { name: 'Reports', href: '/mkuruadmin/reports', icon: BarChart3 },
  { name: 'Messages', href: '/mkuruadmin/messages', icon: MessageSquare },
  { name: 'System', href: '/mkuruadmin/system', icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === '/mkuruadmin' ? pathname === href : pathname.startsWith(href);
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <span className="w-9 h-9 rounded-full border-2 border-black/10 border-t-[#0d0d0d] animate-spin" />
      <p className="text-sm text-black/45">Loading your store…</p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/mkuruadmin';
  const router = useRouter();
  const { status, error, reload, storage, messages } = useAdmin();
  const [open, setOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => { setOpen(false); }, [pathname]);

  // The login screen itself lives inside this layout, so it must never be gated.
  const isLogin = pathname === '/mkuruadmin/login';

  // An expired session drops the user back on the login screen instead of an empty dashboard.
  React.useEffect(() => {
    if (!isLogin && status === 'unauthenticated') {
      router.replace(`/mkuruadmin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLogin, status, pathname, router]);

  // Unread contact-form submissions, surfaced as a dot on the sidebar entry.
  const unread = messages.filter((m) => m.status === 'new').length;

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/mkuruadmin/login';
  };

  // The login screen is its own full-page experience — no sidebar, no top bar.
  if (isLogin) return <>{children}</>;

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10 shrink-0">
        <img
          src="/assets/images/Mkurugenzi-Merch/black-1-of-1-150x150.png"
          alt="Mkurugenzi logo"
          className="h-9 w-9 object-contain brightness-0 invert"
        />
        <span className="text-sm font-bold tracking-wide">Mkurugenzi Admin</span>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="ml-auto lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                active ? 'bg-white text-[#0d0d0d]' : 'text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.name}
              {item.href === '/mkuruadmin/messages' && unread > 0 && (
                <span
                  className={`ml-auto min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    active ? 'bg-[#0d0d0d] text-white' : 'bg-white text-[#0d0d0d]'
                  }`}
                >
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 shrink-0">
        <Link
          href="/mkuruadmin/account"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-2 ${
            pathname.startsWith('/mkuruadmin/account')
              ? 'bg-white text-[#0d0d0d]'
              : 'text-white/50 hover:bg-white/10 hover:text-white'
          }`}
        >
          <UserCog className="w-4 h-4 shrink-0" />
          Account &amp; staff
        </Link>
        <p className="text-[11px] text-white/30 px-4 mb-3">
          {storage === 'mysql' ? 'Connected to MySQL' : 'Local file store'}
        </p>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all w-full disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0d0d0d]">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-[#050505] text-white z-40">
        {sidebar}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#050505] text-white">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-black/5 px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:gap-4 min-w-0">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center border border-black/10 hover:bg-[#f0f0f1] transition-colors shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 text-sm text-black/40 hover:text-[#0d0d0d] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to site
            </Link>
            <span className="hidden sm:block w-px h-5 bg-black/10" />
            <h1 className="font-bold truncate">
              {NAV.find((n) => isActive(pathname, n.href))?.name ?? 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#0d0d0d] flex items-center justify-center">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <span className="hidden sm:block text-sm text-black/50">Admin</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 xl:p-12">
          {status === 'loading' && <Spinner />}
          {status === 'error' && (
            <div className="max-w-md mx-auto mt-16 text-center">
              <h2 className="text-lg font-bold">Could not load the store</h2>
              <p className="text-sm text-black/45 mt-2">{error}</p>
              <button
                onClick={() => void reload()}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0d0d0d] text-white text-sm px-5 py-2.5"
              >
                Try again
              </button>
            </div>
          )}
          {(status === 'ready' || status === 'unauthenticated') && children}
        </main>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <Shell>{children}</Shell>
    </AdminProvider>
  );
}
