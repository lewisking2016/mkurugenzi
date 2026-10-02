'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Crown,
  Sparkles,
  Shirt,
  Star,
  Users,
  Globe,
  Clock,
  Calendar,
  Tag,
} from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6 },
};

const HERO_SLIDES = [
  {
    src: '/assets/images/Mkurugenzi – Merch/9.png',
    alt: 'Mkurugenzi campaign — collection hero',
  },
  {
    src: '/assets/images/Mkurugenzi – Merch/3.png',
    alt: 'Mkurugenzi campaign — sweatsuit hero',
  },
];

export default function HomePage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-advance hero slider
  useEffect(() => {
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const newArrivals = PRODUCTS.slice(0, 6);
  const bestSellers = PRODUCTS.slice(6, 9);

  return (
    <div className="bg-[#fafafa]">

      {/* ================= HERO SLIDER (full screen) ================= */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {HERO_SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 z-0 transition-opacity duration-[1200ms] ease-in-out ${
              i === heroIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full object-cover object-center"
            />
          </div>
        ))}

        {/* Slide indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === heroIndex ? 'w-10 bg-[#0d0d0d]' : 'w-2 bg-black/25 hover:bg-black/50'
              }`}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 text-center pt-24 pb-32">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] max-w-6xl mx-auto leading-[0.95] tracking-tight font-bold text-[#0d0d0d]"
            style={{ fontFamily: 'var(--font-bricolage), Chiswick Grotesque, sans-serif' }}
          >
            MORE THAN
            <br />
            <span className="italic font-bold">JUST A BRAND</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-9 text-xs sm:text-sm font-semibold uppercase tracking-[0.45em] text-[#0d0d0d]"
          >
            Join The Movement
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/shop" className="btn-pill-dark">Shop all items</Link>
            <Link href="/about" className="btn-pill-light">Read our story</Link>
          </motion.div>
        </div>
      </section>

      {/* ================= NEW ARRIVALS ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
        <motion.div {...fadeUp}>
          <div className="pill-tag mb-6">
            <span className="pill-tag-icon"><Sparkles className="w-3.5 h-3.5" /></span>
            New Arrivals
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <h2 className="section-heading text-5xl sm:text-6xl max-w-xl">
              Fresh fits in our latest drop
            </h2>
            <Link href="/shop" className="btn-pill-dark shrink-0">See all collections</Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ================= VIDEO SHOWCASE ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        <div className="relative min-h-[70vh] rounded-3xl overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/assets/images/Mkurugenzi – Merch/12.png"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/assets/videos/mkuru-v1 .mp4" type="video/mp4" />
          </video>

          <button
            onClick={toggleVideo}
            className="absolute left-8 bottom-8 z-20 w-14 h-14 rounded-full bg-white text-[#0d0d0d] flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>

          <div className="absolute left-8 top-8 z-20 pill-tag">
            <span className="pill-tag-icon">
              <img
                src="/assets/images/Mkurugenzi – Merch/black-1-of-1-150x150.png"
                alt="Mkurugenzi logo"
                className="w-5 h-5 object-contain brightness-0 invert"
              />
            </span>
            <span><strong className="font-semibold">Mkurugenzi</strong> — Since 2020</span>
          </div>
        </div>
      </section>

      {/* ================= BEST SELLERS ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
        <motion.div {...fadeUp}>
          <div className="pill-tag mb-6">
            <span className="pill-tag-icon"><Crown className="w-3.5 h-3.5" /></span>
            Best sellers
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <h2 className="section-heading text-5xl sm:text-6xl max-w-xl">
              Our signature best selling pieces
            </h2>
            <Link href="/shop" className="btn-pill-dark shrink-0">See all collections</Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ================= ABOUT SPLIT ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <motion.div {...fadeUp} className="relative rounded-3xl overflow-hidden min-h-[480px] bg-[#f0f0f1]">
            <img
              src="/assets/images/Mkurugenzi – Merch/87047815-30b6-46c8-881f-30520e5d72ea-1-550x660.png"
              alt="Mkurugenzi campaign"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            {...fadeUp}
            className="rounded-3xl bg-[#f0f0f1] p-10 lg:p-14 flex flex-col justify-center"
          >
            <div className="pill-tag mb-8 self-start">
              <span className="pill-tag-icon">
                <img
                  src="/assets/images/Mkurugenzi – Merch/black-1-of-1-150x150.png"
                  alt="Mkurugenzi logo"
                  className="w-5 h-5 object-contain brightness-0 invert"
                />
              </span>
              Since 2020
            </div>
            <h2 className="section-heading text-5xl sm:text-6xl mb-6">
              Defining modern style
            </h2>
            <p className="text-[#4a4a50] text-base leading-relaxed max-w-md mb-10">
              A decade-spanning vision born in Nairobi: we merge urban utility with high-end
              aesthetics in a resilient, beautiful collection of heavyweight essentials.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/about" className="btn-pill-dark">More about us</Link>
              <Link href="/contact" className="btn-pill-light">Contact us</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= COLLECTIONS ZIGZAG ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
        <motion.div {...fadeUp} className="mb-14">
          <div className="pill-tag mb-6">
            <span className="pill-tag-icon"><Shirt className="w-3.5 h-3.5" /></span>
            Our Collections
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="section-heading text-5xl sm:text-6xl max-w-xl">
              Modern collections defined by simplicity
            </h2>
            <Link href="/shop" className="btn-pill-dark shrink-0">Shop all items</Link>
          </div>
        </motion.div>

        <div className="space-y-8">
          {[
            {
              tag: 'New',
              title: "Men's wear",
              sub: 'Premium modern collection for men',
              desc: 'Upgrade your daily look with our crafted pieces made from the finest fabrics for lasting comfort and timeless style.',
              from: 'KES 2,500',
              to: 'KES 6,500',
              img: '/assets/images/Mkurugenzi – Merch/458-550x660.jpg',
              cat: 'gents',
            },
            {
              tag: 'New',
              title: "Women's wear",
              sub: 'Modern daily wear for women',
              desc: 'Elevate your style with our signature soft pieces designed to make every single day feel truly fresh and special.',
              from: 'KES 6,750',
              to: 'KES 6,750',
              img: '/assets/images/Mkurugenzi – Merch/512-550x660.jpg',
              cat: 'ladies',
            },
            {
              tag: '2026',
              title: 'Accessories',
              sub: 'Modern easy styles & essentials',
              desc: 'Provide the finishing touch with heavy canvas totes, ribbed socks, beanies and signature daily carry essentials.',
              from: 'KES 850',
              to: 'KES 2,500',
              img: '/assets/images/Mkurugenzi – Merch/Socks-pair-550x660.png',
              cat: 'accessories',
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              {...fadeUp}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-3xl bg-[#f0f0f1] p-6 lg:p-8 items-center ${
                i % 2 === 1 ? 'lg:[direction:rtl]' : ''
              }`}
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#e6e6e8] [direction:ltr]">
                <img src={c.img} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
              </div>

              <div className="lg:px-8 py-6 [direction:ltr]">
                <div className="flex items-center gap-3 mb-6">
                  <span className="inline-flex items-center bg-[#0d0d0d] text-white text-[13px] font-medium px-4 py-2 rounded-full">
                    {c.tag}
                  </span>
                  <span className="inline-flex items-center bg-white text-[13px] font-medium px-4 py-2 rounded-full">
                    {c.title}
                  </span>
                </div>
                <h3 className="section-heading text-4xl sm:text-5xl mb-4">{c.sub}</h3>
                <p className="text-[#4a4a50] text-base leading-relaxed max-w-md mb-8">{c.desc}</p>

                <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 shrink-0 rounded-full bg-[#f0f0f1] flex items-center justify-center text-[#0d0d0d]"><Tag className="w-5 h-5" /></span>
                    <div>
                      <span className="block text-[13px] text-black/50">Pricing start from:</span>
                      <span className="text-lg font-semibold whitespace-nowrap">
                        {c.from === c.to ? c.from : (
                          <>
                            {c.from} <span className="text-black/30 font-normal px-1">—</span> {c.to}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/shop?cat=${c.cat}`}
                    className="bg-[#0d0d0d] text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-[#2a2a2a] transition-colors sm:shrink-0 self-start sm:self-auto"
                  >
                    All collections
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= CUSTOMER REVIEWS ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
          <div className="pill-tag mb-6 justify-center">
            <span className="pill-tag-icon"><Users className="w-3.5 h-3.5" /></span>
            Customer reviews
          </div>
          <h2 className="section-heading text-5xl sm:text-6xl mb-4">The voice of quality</h2>
          <p className="text-[#4a4a50] text-base leading-relaxed">
            Experience the difference through the words of customers who value premium fabrics
            and timeless design.
          </p>
        </motion.div>

        <motion.div {...fadeUp} className="rounded-3xl bg-[#f0f0f1] p-10 lg:p-16 text-center">
          <div className="flex justify-center gap-1.5 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-[#0d0d0d] text-[#0d0d0d]" />
            ))}
          </div>
          <p className="font-display text-2xl sm:text-3xl lg:text-4xl leading-snug max-w-3xl mx-auto text-[#0d0d0d]">
            &ldquo;The premium quality of the collection is truly unmatched. The fabrics feel
            incredibly premium and soft — a very sharp look. I love it every day.&rdquo;
          </p>
          <div className="mt-10">
            <p className="font-semibold text-[#0d0d0d]">James Carter</p>
            <p className="text-sm text-black/50 mt-1">Creative Director</p>
            <div className="inline-flex items-center gap-2 mt-6 bg-white rounded-full px-5 py-2.5 text-sm font-medium">
              <Star className="w-4 h-4 fill-[#0d0d0d]" />
              4.9/5 from 1k+ reviews
            </div>
          </div>
        </motion.div>
      </section>

      {/* ================= WHAT DEFINES OUR WEAR ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
          <div className="pill-tag mb-6 justify-center">
            <span className="pill-tag-icon"><Shirt className="w-3.5 h-3.5" /></span>
            What defines our wear
          </div>
          <h2 className="section-heading text-5xl sm:text-6xl mb-4">Where style meets ease</h2>
          <p className="text-[#4a4a50] text-base leading-relaxed">
            Thoughtful design blending modern style, comfort, and versatility for everyday
            living across lifestyles.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: 'Everyday Comfort',
              desc: 'Designed to feel natural on the body throughout long, active days.',
              tags: ['All-day wear', 'Comfort', 'Relaxed fit'],
              imgs: [
                '/assets/images/Mkurugenzi – Merch/Beige-Tshirt-600x750.webp',
                '/assets/images/Mkurugenzi – Merch/Burgundy-Tshirt-600x750.webp',
              ],
            },
            {
              title: 'Modern Silhouettes',
              desc: 'Contemporary shapes balance structure & ease for confident everyday styling.',
              tags: ['Balanced fit', 'Modern', 'Structured'],
              imgs: [
                '/assets/images/Mkurugenzi – Merch/476-550x660.jpg',
                '/assets/images/Mkurugenzi – Merch/512-550x660.jpg',
              ],
            },
            {
              title: 'Effortless Styling',
              desc: 'Pieces work together naturally, making daily outfit choices simple & intuitive.',
              tags: ['Versatile', 'Easy to style', 'Layered'],
              imgs: [
                '/assets/images/Mkurugenzi – Merch/White-tshirt-600x750.webp',
                '/assets/images/Mkurugenzi – Merch/Beige-Tshirt.webp',
              ],
            },
            {
              title: 'Daily Essentials',
              desc: 'Core clothing pieces designed for frequent wear across modern everyday routines.',
              tags: ['Core pieces', 'Everyday', 'Wearable'],
              imgs: [
                '/assets/images/Mkurugenzi – Merch/black-tshirt-2-600x750.webp',
                '/assets/images/Mkurugenzi – Merch/12.png',
              ],
            },
            {
              title: 'Wearable Design',
              desc: 'Design decisions focused on comfort, fit, and real-life wearability.',
              tags: ['Practical', 'Functional', 'Adaptable'],
              imgs: [
                '/assets/images/Mkurugenzi – Merch/342-550x660.jpg',
                '/assets/images/Mkurugenzi – Merch/395-550x660.jpg',
              ],
            },
            {
              title: 'Clean Aesthetic',
              desc: 'Minimal design built to feel natural and timeless, drop after drop.',
              tags: ['Clean lines', 'Minimal', 'Timeless'],
              imgs: [
                '/assets/images/Mkurugenzi – Merch/BlackHoodie-600x750.webp',
                '/assets/images/Mkurugenzi – Merch/a.png',
              ],
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
              className="rounded-3xl bg-[#f0f0f1] p-8"
            >
              {/* Fanned polaroid images */}
              <div className="relative h-64 mb-8 flex items-center justify-center">
                <div className="absolute w-40 h-52 rounded-2xl overflow-hidden bg-white shadow-lg -rotate-12 -translate-x-8 border border-black/5">
                  <img src={f.imgs[0]} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute w-40 h-52 rounded-2xl overflow-hidden bg-white shadow-xl rotate-6 translate-x-8 border border-black/5">
                  <img src={f.imgs[1]} alt={f.title} className="w-full h-full object-cover" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-[#0d0d0d] mb-2">{f.title}</h3>
              <p className="text-[#4a4a50] text-sm leading-relaxed mb-6">{f.desc}</p>
              <div className="flex flex-wrap gap-2">
                {f.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[13px] font-medium text-[#0d0d0d] bg-white border border-black/10 rounded-full px-4 py-1.5"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= MKURUGENZI VOICE / BLOG ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
        <motion.div {...fadeUp} className="mb-14">
          <div className="pill-tag mb-6">
            <span className="pill-tag-icon"><Globe className="w-3.5 h-3.5" /></span>
            Mkurugenzi Voice
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="section-heading text-5xl sm:text-6xl max-w-xl">
              Elevating your daily style journey
            </h2>
            <Link href="/contact" className="btn-pill-dark shrink-0">Read all blogs</Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            {
              cat: 'Style Guide',
              title: 'How to master the art of minimal street style',
              desc: 'Build a timeless, comfortable wardrobe with high-quality fabrics, muted tones, and effortless oversized fits.',
              read: '8 min read',
              date: 'Jan 29, 2026',
              img: '/assets/images/Mkurugenzi – Merch/476-550x660.jpg',
              wide: true,
            },
            {
              cat: 'Fashion Tips',
              title: 'Elevate everyday outfits using modern minimalist styling',
              read: '8 min read',
              date: '12/30/25',
              img: '/assets/images/Mkurugenzi – Merch/395-550x660.jpg',
            },
            {
              cat: 'Style Guide',
              title: 'Build a capsule wardrobe that works year round',
              read: '5 min read',
              date: '11/22/25',
              img: '/assets/images/Mkurugenzi – Merch/White-tshirt-600x750.webp',
            },
          ].map((post) => (
            <motion.article
              key={post.title}
              {...fadeUp}
              className={`rounded-3xl overflow-hidden bg-[#f0f0f1] grid ${
                post.wide ? 'lg:col-span-2 lg:grid-cols-2' : ''
              }`}
            >
              <div className={`relative ${post.wide ? 'min-h-[280px]' : 'aspect-[4/3]'}`}>
                <img src={post.img} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className={`p-8 flex flex-col ${post.wide ? 'justify-center' : ''}`}>
                <span className="text-[13px] font-medium text-black/50 mb-3">{post.cat}</span>
                <h3 className="text-xl font-semibold text-[#0d0d0d] leading-snug mb-3">{post.title}</h3>
                {post.desc && <p className="text-sm text-[#4a4a50] leading-relaxed mb-4">{post.desc}</p>}
                <div className="mt-auto flex items-center gap-3 text-[13px] text-black/50 pt-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {post.read}
                  </span>
                  <span className="w-px h-4 bg-black/15" />
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> {post.date}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ================= STAY CONNECTED ================= */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-24 pb-0">
        <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
          <div className="pill-tag mb-6 justify-center">
            <span className="pill-tag-icon"><Globe className="w-3.5 h-3.5" /></span>
            Stay connected
          </div>
          <h2 className="section-heading text-5xl sm:text-6xl mb-4">
            See our community in modern silhouettes
          </h2>
          <p className="text-[#4a4a50] text-base leading-relaxed mb-8">
            Connect with us on social media for a daily dose of fresh style, featuring exclusive
            looks from our community.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/shop" className="btn-pill-dark">See collections</Link>
            <Link href="/contact" className="btn-pill-light">Contact us</Link>
          </div>
        </motion.div>

        {/* Community image strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {[
            '/assets/images/Mkurugenzi – Merch/122-1-1-550x660.jpg',
            '/assets/images/Mkurugenzi – Merch/237-1-550x660.jpg',
            '/assets/images/Mkurugenzi – Merch/290-550x660.jpg',
            '/assets/images/Mkurugenzi – Merch/309-550x660.jpg',
            '/assets/images/Mkurugenzi – Merch/342-550x660.jpg',
            '/assets/images/Mkurugenzi – Merch/395-550x660.jpg',
          ].map((img, i) => (
            <motion.div
              key={img}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`aspect-[3/4] rounded-2xl overflow-hidden bg-[#f0f0f1] ${
                i % 2 === 0 ? 'translate-y-4' : '-translate-y-2'
              }`}
            >
              <img src={img} alt="Community member" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}
