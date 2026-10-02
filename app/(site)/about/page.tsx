'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6 },
};

export default function AboutPage() {
  return (
    <div className="pt-16 pb-24">

      {/* Hero */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center space-y-6 pt-16 pb-20">
        <div className="pill-tag justify-center mb-4">
          <span className="pill-tag-icon">
            <img
              src="/assets/images/Mkurugenzi – Merch/black-1-of-1-150x150.png"
              alt="Mkurugenzi logo"
              className="w-5 h-5 object-contain brightness-0 invert"
            />
          </span>
          Est. 2020 · Nairobi, Kenya
        </div>
        <h1 className="section-heading text-6xl sm:text-7xl md:text-8xl">
          The Mkurugenzi Standard
        </h1>
        <p className="text-[#4a4a50] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Mkurugenzi is more than a fashion label — it is a movement. Born out of the pulse of
          Nairobi streets, we fuse heavy-weight custom fabrics, minimal typography, and tailored
          silhouettes for the visionary leader.
        </p>
      </section>

      {/* Story split */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <motion.div {...fadeUp} className="relative rounded-3xl overflow-hidden min-h-[480px] bg-[#f0f0f1]">
            <img
              src="/assets/images/Mkurugenzi – Merch/12.png"
              alt="Mkurugenzi Craftsmanship"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>

          <motion.div {...fadeUp} className="rounded-3xl bg-[#f0f0f1] p-10 lg:p-14 flex flex-col justify-center">
            <h2 className="section-heading text-4xl sm:text-5xl mb-6">
              Uncompromising quality & local craft
            </h2>
            <p className="text-[#4a4a50] text-base leading-relaxed mb-4">
              &ldquo;Mkurugenzi&rdquo; translates to Director or CEO. Our garments are designed for
              individuals who direct their own lives and redefine African luxury on a global stage.
            </p>
            <p className="text-[#4a4a50] text-base leading-relaxed mb-10">
              Every piece in our catalog — from our signature heavyweight 450GSM sweatsuits to
              structured quarter-zips — undergoes rigorous precision stitching, custom embroidery,
              and anti-shrink treatments.
            </p>
            <Link href="/shop" className="btn-pill-dark self-start">Shop all items</Link>
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-24">
        <motion.div {...fadeUp} className="text-center max-w-xl mx-auto mb-16">
          <div className="pill-tag justify-center mb-6">
            <span className="pill-tag-icon">
              <img
                src="/assets/images/Mkurugenzi – Merch/black-1-of-1-150x150.png"
                alt="Mkurugenzi logo"
                className="w-5 h-5 object-contain brightness-0 invert"
              />
            </span>
            Pillars of Mkurugenzi
          </div>
          <h2 className="section-heading text-5xl sm:text-6xl">What drives us</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Crafted for Durability',
              desc: 'Heavyweight custom cotton weaves designed to maintain structure, color intensity, and comfort for years.',
            },
            {
              title: 'Contemporary Cut',
              desc: 'Boxy drop-shoulder fits engineered for modern street style with dynamic movement and effortless silhouette.',
            },
            {
              title: 'Nairobi Pride',
              desc: 'Proudly Kenyan-rooted with a global design aesthetic, empowering local creators and artisans.',
            },
          ].map((p, i) => (
            <motion.div
              key={p.title}
              {...fadeUp}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-3xl bg-[#f0f0f1] p-10"
            >
              <span className="text-5xl font-display font-medium text-black/15">{`0${i + 1}`}</span>
              <h3 className="text-2xl font-semibold text-[#0d0d0d] mt-6 mb-3">{p.title}</h3>
              <p className="text-[#4a4a50] text-sm leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <motion.div
          {...fadeUp}
          className="rounded-3xl bg-[#0d0d0d] text-white p-12 lg:p-20 text-center"
        >
          <h2 className="section-heading text-white text-4xl sm:text-6xl mb-4">
            Direct your identity
          </h2>
          <p className="text-white/60 max-w-xl mx-auto mb-10">
            Explore the full collection of heavyweight essentials, designed and crafted in Nairobi.
          </p>
          <Link href="/shop" className="inline-flex items-center bg-white text-[#0d0d0d] rounded-full px-8 py-4 text-sm font-medium hover:bg-[#0d0d0d] hover:text-white hover:ring-1 hover:ring-white/40 transition-colors">
            Shop all items
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
