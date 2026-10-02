'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Phone, MapPin } from 'lucide-react';
import { MorphText } from '@/components/MorphText';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-[#050505] text-white mt-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        {/* Subscribe row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-16 border-b border-white/10">
          <h2 className="font-display text-4xl sm:text-5xl font-medium leading-[1.1] max-w-md">
            Subscribe to<br />our news later
          </h2>
          <form onSubmit={handleSubscribe} className="flex items-center gap-3 w-full min-w-0 lg:w-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              // min-w-0 lets the field shrink below its intrinsic width; without it the
              // Subscribe button pushes the whole page into a horizontal scroll on phones.
              className="min-w-0 flex-1 lg:w-80 lg:flex-none bg-white/10 border border-white/10 rounded-full px-6 py-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
            />
            <button
              type="submit"
              className="bg-white text-[#0d0d0d] rounded-full px-7 py-4 text-sm font-medium hover:bg-black/10 hover:text-white transition-colors shrink-0"
            >
              {subscribed ? 'Subscribed ✓' : 'Subscribe'}
            </button>
          </form>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 py-16">
          <div>
            <img
              src="/assets/images/Mkurugenzi – Merch/black-1-of-1-300x300.png"
              alt="Mkurugenzi logo"
              className="h-16 w-16 object-contain brightness-0 invert"
            />
            <p className="text-white/50 text-sm leading-relaxed mt-4 max-w-xs">
              A premium streetwear house designed for modern and minimalist brands. Est. 2020, Nairobi.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center bg-white text-[#0d0d0d] rounded-full px-6 py-3 text-sm font-medium mt-6 hover:bg-black/10 hover:text-white transition-colors"
            >
              Contact Mkurugenzi
            </Link>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-3 text-white/50 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/shop" className="hover:text-white transition-colors">Shop</Link></li>
              <li><Link href="/faqs" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-5">Shop</h4>
            <ul className="space-y-3 text-white/50 text-sm">
              <li><Link href="/cart" className="hover:text-white transition-colors">Cart</Link></li>
              <li><Link href="/checkout" className="hover:text-white transition-colors">Checkout</Link></li>
              <li><Link href="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">My account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-5">Follow us:</h4>
            <ul className="space-y-3 text-white/50 text-sm">
              <li><a href="https://www.instagram.com/mkurugenzimerch" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="https://wa.me/254716265661" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a></li>
              <li><a href="https://www.tiktok.com/@mkurugenzimerch" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">TikTok</a></li>
              <li><a href="https://x.com/mkurugenzimerch" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-5">Get in touch</h4>
            <ul className="space-y-3 text-white/50 text-sm">
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </span>
                +254 716 265 661
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </span>
                info@mkurugenzi.co.ke
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </span>
                Nairobi, Kenya
              </li>
            </ul>
          </div>
        </div>

        {/* Animated giant wordmark */}
        <div className="overflow-hidden pt-8 pb-2">
          <MorphText
            words={['MKURUGENZI', 'MORE THAN JUST A BRAND', 'JOIN THE MOVEMENT']}
            interval={4000}
            fontSize="clamp(2.5rem, 8vw, 9rem)"
            fontFamily="var(--font-inter), sans-serif"
            textClassName="text-white"
            subtextClassName="text-white/40"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>© 2026 Mkurugenzi ®. All Rights Reserved.</p>
          <p className="tracking-[0.15em] uppercase">Built for the bold · Nairobi, Kenya</p>
        </div>
      </div>
    </footer>
  );
};
