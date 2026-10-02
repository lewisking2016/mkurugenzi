'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';

export default function AccountPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState('');

  const inputClass =
    'w-full pl-11 pr-5 py-3.5 rounded-full bg-white border border-black/10 text-sm focus:outline-none focus:border-black/40 transition-colors';

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggedIn(true);
  };

  if (loggedIn) {
    return (
      <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto space-y-5 pt-20 pb-14">
          <div className="pill-tag justify-center mb-2">
            <span className="pill-tag-icon">
              <img
                src="/assets/images/Mkurugenzi – Merch/black-1-of-1-150x150.png"
                alt="Mkurugenzi logo"
                className="w-5 h-5 object-contain brightness-0 invert"
              />
            </span>
            My account
          </div>
          <h1 className="section-heading text-5xl sm:text-6xl">Karibu, {name || 'Director'}</h1>
          <p className="text-black/50">Welcome back to the movement.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { title: 'Orders', desc: 'Track & review your orders', href: '/cart', icon: ShoppingBagIcon },
            { title: 'Wishlist', desc: 'Your saved pieces', href: '/wishlist', icon: HeartIcon },
            { title: 'Shop', desc: 'Continue browsing', href: '/shop', icon: GridIcon },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="p-8 rounded-3xl bg-[#f0f0f1] hover:bg-[#e8e8ea] transition-colors text-center"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-4 text-[#0d0d0d]">
                <card.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-[#0d0d0d] mb-1">{card.title}</h3>
              <p className="text-xs text-black/50">{card.desc}</p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => setLoggedIn(false)}
            className="text-sm text-black/50 hover:text-[#0d0d0d] underline transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10">
      <div className="text-center max-w-2xl mx-auto space-y-5 pt-16 pb-14">
        <div className="pill-tag justify-center mb-2">
          <span className="pill-tag-icon">
            <img
              src="/assets/images/Mkurugenzi – Merch/black-1-of-1-150x150.png"
              alt="Mkurugenzi logo"
              className="w-5 h-5 object-contain brightness-0 invert"
            />
          </span>
          My account
        </div>
        <h1 className="section-heading text-6xl sm:text-7xl">Sign in</h1>
        <p className="text-black/50">Access your orders, wishlist and faster checkout.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto bg-[#f0f0f1] rounded-3xl p-8 sm:p-10"
      >
        {/* Tabs */}
        <div className="flex bg-white rounded-full p-1 mb-8">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
                mode === m ? 'bg-[#0d0d0d] text-white' : 'text-black/60 hover:text-[#0d0d0d]'
              }`}
            >
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'register' && (
            <div className="relative">
              <User className="w-4 h-4 text-black/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input required placeholder="Full name" className={inputClass} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="relative">
            <User className="w-4 h-4 text-black/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input required placeholder="Username or email" className={inputClass} />
          </div>
          <div className="relative">
            {mode === 'register' ? (
              <Mail className="w-4 h-4 text-black/40 absolute left-4 top-1/2 -translate-y-1/2" />
            ) : (
              <Lock className="w-4 h-4 text-black/40 absolute left-4 top-1/2 -translate-y-1/2" />
            )}
            <input
              required
              type={mode === 'register' ? 'email' : 'password'}
              placeholder={mode === 'register' ? 'Email address' : 'Password'}
              className={inputClass}
            />
          </div>
          {mode === 'register' && (
            <div className="relative">
              <Lock className="w-4 h-4 text-black/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input required type="password" placeholder="Create password" className={inputClass} />
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#0d0d0d] text-white rounded-full py-4 text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
          >
            {mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {mode === 'login' && (
          <p className="text-center text-xs text-black/45 mt-5">
            <span className="hover:text-[#0d0d0d] underline cursor-pointer">Lost your password?</span>
          </p>
        )}
      </motion.div>
    </div>
  );
}

// Small local icon wrappers to keep imports tidy
import { ShoppingBag as ShoppingBagIcon, Heart as HeartIcon, LayoutGrid as GridIcon } from 'lucide-react';
