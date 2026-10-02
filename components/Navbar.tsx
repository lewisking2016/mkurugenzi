'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, Search, Heart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { openCart, cartCount, wishlistCount } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/shop', label: 'Shop' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <>
      {/* Black marquee announcement bar */}
      <div className="bg-black text-white text-[13px] font-medium py-2.5 overflow-hidden relative z-50">
        <div className="whitespace-nowrap flex animate-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center shrink-0" aria-hidden={dup === 1}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="px-10">Delivery countrywide · Pay on delivery in Nairobi</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main sticky nav */}
      <header
        className={`sticky top-0 left-0 right-0 z-40 transition-all duration-300 bg-[#fafafa] ${
          isScrolled ? 'shadow-[0_1px_0_rgba(0,0,0,0.08)]' : ''
        }`}
      >
        <div className="max-w-[1400px] mx-auto pl-6 pr-4 lg:pl-10 lg:pr-6 grid grid-cols-[1fr_auto_1fr] items-center h-[84px]">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group justify-self-start">
            <img
              src="/assets/images/Mkurugenzi-Merch/black-1-of-1-300x300.png"
              alt="Mkurugenzi logo"
              className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Center links */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] text-[#0d0d0d] justify-self-center">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`transition-colors hover:text-black/60 ${
                  pathname === l.href ? 'font-semibold' : 'font-normal'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 justify-self-end">
            <Link
              href="/shop"
              aria-label="Search"
              className="hidden sm:flex w-11 h-11 rounded-full bg-white border border-black/10 items-center justify-center text-[#0d0d0d] hover:bg-black/5 transition-colors"
            >
              <Search className="w-[18px] h-[18px]" />
            </Link>

            {/* Wishlist stays visible on phones — it is the only way into /wishlist there. */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="flex w-11 h-11 rounded-full bg-white border border-black/10 items-center justify-center text-[#0d0d0d] hover:bg-black/5 transition-colors relative"
            >
              <Heart className="w-[18px] h-[18px]" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0d0d0d] text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/account"
              aria-label="Account"
              className="hidden sm:flex w-11 h-11 rounded-full bg-white border border-black/10 items-center justify-center text-[#0d0d0d] hover:bg-black/5 transition-colors"
            >
              <User className="w-[18px] h-[18px]" />
            </Link>

            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center bg-[#0d0d0d] text-white rounded-full px-6 py-3 text-[15px] font-medium hover:bg-[#2a2a2a] transition-colors"
            >
              Shop all items
            </Link>

            <button
              onClick={openCart}
              className="flex w-11 h-11 rounded-full bg-white border border-black/10 items-center justify-center text-[#0d0d0d] hover:bg-black/5 transition-colors relative"
              aria-label="Cart"
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0d0d0d] text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 text-[#0d0d0d]"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed inset-0 z-50 bg-[#fafafa] flex flex-col p-6"
          >
            <div className="flex items-center justify-between pb-6">
              <img
                src="/assets/images/Mkurugenzi-Merch/black-1-of-1-100x100.png"
                alt="Mkurugenzi logo"
                className="h-9 w-9 object-contain"
              />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="w-11 h-11 rounded-full bg-white border border-black/10 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-2 py-8 text-2xl text-[#0d0d0d]">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileNavOpen(false)}
                  className="py-2 hover:opacity-60 transition-opacity"
                >
                  {l.label}
                </Link>
              ))}

              <Link
                href="/wishlist"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 flex items-center gap-3 hover:opacity-60 transition-opacity"
              >
                Wishlist
                {mounted && wishlistCount > 0 && (
                  <span className="text-base font-medium text-black/40">({wishlistCount})</span>
                )}
              </Link>

              <Link
                href="/account"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 hover:opacity-60 transition-opacity"
              >
                Account
              </Link>
            </nav>

            <Link
              href="/shop"
              onClick={() => setMobileNavOpen(false)}
              className="mt-auto inline-flex items-center justify-center bg-[#0d0d0d] text-white rounded-full px-6 py-4 text-base font-medium"
            >
              Shop all items
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
