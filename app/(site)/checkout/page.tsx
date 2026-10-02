'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Check, MessageCircle, Lock, Truck, ArrowLeft, Printer, Download, CircleCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const PAYMENT_METHODS = [
  {
    id: 'mpesa',
    title: 'M-Pesa',
    desc: 'Pay via M-Pesa on confirmation',
    directions: [
      'Our team sends the Till/Paybill number on WhatsApp after you place the order.',
      'Open M-Pesa → Lipa na M-Pesa → Pay Bill (or Buy Goods for Till).',
      'Enter the amount shown below, your PIN, and confirm.',
      'Send the M-Pesa confirmation SMS to us on WhatsApp to complete your order.',
    ],
  },
  {
    id: 'cod',
    title: 'Pay on delivery',
    desc: 'Cash or M-Pesa at delivery',
    directions: [
      'Place your order — no payment needed now.',
      'Our rider delivers to your address within the promised window.',
      'Inspect your items, then pay in cash or via M-Pesa on the spot.',
      'A confirmation message is sent to WhatsApp once payment is received.',
    ],
  },
  {
    id: 'paypal',
    title: 'PayPal',
    desc: 'Pay with your PayPal balance or linked card',
    badge: 'PayPal',
    directions: [
      'Place your order — a PayPal invoice arrives on your email.',
      'Open the invoice and log in to your PayPal account.',
      'Review the amount and approve the payment.',
      'Send the payment confirmation to us on WhatsApp to dispatch your order.',
    ],
  },
  {
    id: 'card',
    title: 'Card payment',
    desc: 'Visa, Mastercard & American Express accepted',
    badge: 'VISA / MC / AMEX',
    directions: [
      'Place your order — a secure payment link is sent to your phone or email.',
      'Open the link and enter your card details (Visa, Mastercard or Amex).',
      'Confirm the amount and approve with your card PIN / 3-D Secure prompt.',
      'Share the confirmation with us on WhatsApp to complete your order.',
    ],
  },
];

interface PlacedOrder {
  reference: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  status: string;
}

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    county: 'Nairobi',
    town: '',
    address: '',
    notes: '',
    inquiry: '',
  });

  // The reference is assigned by the server on submit; before that there is nothing
  // truthful to show, so we do not print a made-up order number.
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedAt, setPlacedAt] = useState<Date | null>(null);
  const [cartSnapshot, setCartSnapshot] = useState<typeof cart>([]);

  // Delivery pricing comes from the admin settings so the quote shown here matches
  // what the server actually charges. Zeroes mean free until they load.
  const [fees, setFees] = useState({
    freeDeliveryThreshold: 0,
    deliveryFeeNairobi: 0,
    deliveryFeeOutside: 0,
  });

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/storefront')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setFees({
          freeDeliveryThreshold: data.freeDeliveryThreshold ?? 0,
          deliveryFeeNairobi: data.deliveryFeeNairobi ?? 0,
          deliveryFeeOutside: data.deliveryFeeOutside ?? 0,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const inquiry = form.inquiry;
  const selected = inquiry
    ? PAYMENT_METHODS.find((p) => p.id === inquiry)
    : PAYMENT_METHODS[0];

  const deliveryFee =
    cartTotal > 0 && cartTotal < fees.freeDeliveryThreshold
      ? form.county === 'Nairobi'
        ? fees.deliveryFeeNairobi
        : fees.deliveryFeeOutside
      : 0;
  const grandTotal = cartTotal + deliveryFee;

  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Kiambu', 'Machakos',
    'Kajiado', 'Nyeri', 'Meru', 'Kakamega', 'Kisii', 'Kilifi', 'Bungoma', 'Other',
  ];

  const [snapshot, setSnapshot] = useState<{
    items: typeof cart;
    subtotal: number;
    deliveryFee: number;
    grandTotal: number;
  } | null>(null);

  const openWhatsAppInquiry = () => {
    const text = [
      'Hello Mkurugenzi — I would like to place an order.',
      `Order total: KES ${grandTotal.toLocaleString()}`,
      `Payment: ${selected.title || 'Select a payment platform'}`,
      `Deliver to: ${form.fullName}, ${form.address}, ${form.town}, ${form.county} County`,
      `Phone: ${form.phone}`,
    ].join('\n');
    window.open(`https://wa.me/254716265661?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // `website` is the honeypot — a real shopper never sees or fills it.
        body: JSON.stringify({
          name: form.fullName,
          phone: form.phone,
          email: form.email,
          county: form.county,
          town: form.town,
          address: form.address,
          notes: form.notes,
          payment: inquiry || 'mpesa',
          website: '',
          items: cart.map((item) => ({ productId: item.id, size: item.size, qty: item.qty })),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || 'We could not place your order. Please try again.');
        return;
      }

      // The server re-priced every line, so the receipt shows its numbers.
      setCartSnapshot(cart);
      setSnapshot({
        items: cart,
        subtotal: payload.subtotal ?? cartTotal,
        deliveryFee: payload.deliveryFee ?? deliveryFee,
        grandTotal: payload.total ?? grandTotal,
      });
      setPlacedOrder({
        reference: payload.reference,
        total: payload.total,
        subtotal: payload.subtotal,
        deliveryFee: payload.deliveryFee,
        status: payload.status,
      });
      setPlacedAt(new Date());
      clearCart();
    } catch {
      setError('Network problem — please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const inputClass =
    'w-full px-5 py-3.5 rounded-full bg-white border border-black/10 text-sm focus:outline-none focus:border-black/40 transition-colors';

  // ── Receipt screen ──────────────────────────────────────────────────────
  if (placedOrder) {
    const fmtDate = placedAt
      ? placedAt.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) +
        ' · ' +
        placedAt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
      : '';
    const pay = PAYMENT_METHODS.find((p) => p.id === inquiry) || PAYMENT_METHODS[0];

    return (
      <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto pt-16"
        >
          {/* Success header */}
          <div className="text-center space-y-4 mb-10">
            <div className="w-20 h-20 rounded-full bg-[#0d0d0d] flex items-center justify-center mx-auto">
              <CircleCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="section-heading text-5xl sm:text-6xl">Order placed</h1>
            <p className="text-black/60">
              Order <span className="font-bold text-[#0d0d0d]">{placedOrder.reference}</span> was received.
              You can print or save your receipt here.
            </p>
          </div>

          {/* Receipt card */}
          <div className="bg-[#f0f0f1] rounded-3xl p-8 sm:p-10">
            <div className="flex items-center justify-between pb-6 border-b border-black/10">
              <img
                src="/assets/images/Mkurugenzi-Merch/black-1-of-1-300x300.png"
                alt="Mkurugenzi logo"
                className="h-12 w-12 object-contain"
              />
              <div className="text-right text-xs text-black/50">
                <p className="font-semibold text-[#0d0d0d] text-sm">Mkurugenzi ®</p>
                <p>Nairobi, Kenya</p>
                <p>wa.me/254716265661</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-5 border-b border-black/10 text-sm">
              <div>
                <p className="text-black/50 text-xs uppercase tracking-wider mb-1">Receipt</p>
                <p className="font-bold">{placedOrder.reference}</p>
              </div>
              <div className="text-right">
                <p className="text-black/50 text-xs uppercase tracking-wider mb-1">Date</p>
                <p className="font-medium">{fmtDate}</p>
              </div>
            </div>

            {/* Items */}
            <div className="py-5 space-y-4 border-b border-black/10">
              {cartSnapshot.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex items-center gap-4">
                  <div className="w-12 h-14 rounded-lg overflow-hidden bg-[#e3e3e5] shrink-0">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-black/50">Size: {item.size} · Qty: {item.qty}</p>
                  </div>
                  <span className="text-sm font-semibold">KES {(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-5 space-y-2.5 text-sm border-b border-black/10">
              <div className="flex justify-between">
                <span className="text-black/60">Subtotal</span>
                <span className="font-semibold">KES {(snapshot?.subtotal ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">Delivery</span>
                <span className="font-semibold">{snapshot?.deliveryFee === 0 ? 'Free' : `KES ${(snapshot?.deliveryFee ?? 0).toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between text-lg pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold">KES {(snapshot?.grandTotal ?? 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Customer + payment */}
            <div className="py-5 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm border-b border-black/10">
              <div>
                <p className="text-black/50 text-xs uppercase tracking-wider mb-1.5">Deliver to</p>
                <p className="font-medium">{form.fullName}</p>
                <p className="text-black/60">{form.phone}</p>
                <p className="text-black/60">{form.address}, {form.town}</p>
                <p className="text-black/60">{form.county} County</p>
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase tracking-wider mb-1.5">Payment method</p>
                <p className="font-medium">{pay.title}</p>
                <p className="text-black/60 text-xs mt-1 leading-relaxed">{pay.desc}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-[#0d0d0d] border border-black/10 rounded-full py-4 text-sm font-medium hover:bg-black/5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print receipt
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-[#0d0d0d] border border-black/10 rounded-full py-4 text-sm font-medium hover:bg-black/5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Save as PDF
                </button>
              </div>
              <button
                onClick={openWhatsAppInquiry}
                className="w-full inline-flex items-center justify-center gap-2 bg-white text-[#0d0d0d] border border-black/10 rounded-full py-4 text-sm font-medium hover:bg-black/5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Inquire on WhatsApp — KES {(snapshot?.grandTotal ?? 0).toLocaleString()}
              </button>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-black/60 hover:text-[#0d0d0d] transition-colors">
              Continue shopping <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center py-24 bg-[#f0f0f1] rounded-3xl mt-16">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-black/40" />
          </div>
          <h1 className="text-2xl font-semibold text-[#0d0d0d] mb-2">Your cart is empty</h1>
          <p className="text-black/50 mb-8">Add some pieces before checking out.</p>
          <Link href="/shop" className="btn-pill-dark">Return to shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-5 pt-16 pb-14">
        <div className="pill-tag justify-center mb-2">
          <span className="pill-tag-icon">
            <img
              src="/assets/images/Mkurugenzi-Merch/black-1-of-1-150x150.png"
              alt="Mkurugenzi logo"
              className="w-5 h-5 object-contain brightness-0 invert"
            />
          </span>
          Secure checkout
        </div>
        <h1 className="section-heading text-6xl sm:text-7xl">Checkout</h1>
        <p className="text-black/50 text-sm flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5" /> Your order number is issued when you place the order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">
          {/* Contact */}
          <section className="bg-[#f0f0f1] rounded-3xl p-8 space-y-5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0d0d0d] text-white text-sm font-semibold flex items-center justify-center">1</span>
              <h2 className="text-xl font-semibold">Contact information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input required placeholder="Full name *" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputClass} />
              <input required type="tel" placeholder="Phone / WhatsApp *" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
              <input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => set('email', e.target.value)} className={`${inputClass} sm:col-span-2`} />
            </div>
          </section>

          {/* Delivery */}
          <section className="bg-[#f0f0f1] rounded-3xl p-8 space-y-5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0d0d0d] text-white text-sm font-semibold flex items-center justify-center">2</span>
              <h2 className="text-xl font-semibold">Delivery details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select value={form.county} onChange={(e) => set('county', e.target.value)} className={inputClass}>
                {counties.map((c) => <option key={c} value={c}>{c} County</option>)}
              </select>
              <input required placeholder="Town / Estate *" value={form.town} onChange={(e) => set('town', e.target.value)} className={inputClass} />
              <input required placeholder="Street / Building / Room *" value={form.address} onChange={(e) => set('address', e.target.value)} className={`${inputClass} sm:col-span-2`} />
              <textarea rows={3} placeholder="Delivery notes (optional)" value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`${inputClass} sm:col-span-2 rounded-2xl resize-none`} />
            </div>
          </section>            {/* Payment — platform selection */}
          <section className="bg-[#f0f0f1] rounded-3xl p-8 space-y-5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#0d0d0d] text-white text-sm font-semibold flex items-center justify-center">3</span>
              <h2 className="text-xl font-semibold">Select payment platform</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PAYMENT_METHODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => set('inquiry', p.id)}
                  className={`text-left p-5 rounded-2xl border-2 transition-all ${
                    inquiry === p.id
                      ? 'border-[#0d0d0d] bg-white'
                      : 'border-transparent bg-white/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#0d0d0d]">{p.title}</span>
                    {inquiry === p.id && (
                      <span className="w-5 h-5 rounded-full bg-[#0d0d0d] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-black/50">{p.desc}</span>
                </button>
              ))}
            </div>

            {/* Accepted platform marks */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-xs text-black/45">Accepted:</span>
              <span className="bg-white border border-black/10 rounded px-2 py-1 text-[11px] font-bold text-[#003087]">PayPal</span>
              <span className="inline-flex items-center -space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#EB001B] border border-white" />
                <span className="w-5 h-5 rounded-full bg-[#F79E1B]/90 border border-white" />
              </span>
              <span className="bg-white border border-black/10 rounded px-2 py-1 text-[11px] font-bold italic text-[#1A1F71]">VISA</span>
              <span className="bg-[#2E77BC] rounded px-2 py-1 text-[11px] font-bold text-white">AMEX</span>
              <span className="bg-[#42b72a] rounded px-2 py-1 text-[11px] font-bold text-white">M-Pesa</span>
            </div>

            {/* Payment directions */}
            <motion.div
              key={inquiry === '' ? selected.id : inquiry}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6"
            >
              <h3 className="font-semibold text-[#0d0d0d] mb-3">
                {inquiry === '' ? 'How would you like to pay?' : `How to pay with ${selected.title}`}
              </h3>
              <ol className="space-y-2.5">
                {inquiry === '' ? (
                  <>
                    <li className="flex gap-3 text-sm text-[#4a4a50] leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-[#f0f0f1] text-[#0d0d0d] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span className="font-medium text-[#0d0d0d]">Pick a platform above — M-Pesa, PayPal, Visa, Mastercard or Amex.</span>
                    </li>
                    <li className="flex gap-3 text-sm text-[#4a4a50] leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-[#f0f0f1] text-[#0d0d0d] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span className="font-medium text-[#0d0d0d]">Pay online, then we dispatch. No WhatsApp needed for the payment.</span>
                    </li>
                    <li className="flex gap-3 text-sm text-[#4a4a50] leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-[#f0f0f1] text-[#0d0d0d] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span className="font-medium text-[#0d0d0d]">If you&rsquo;d rather talk first, hit &lsquo;Inquire on WhatsApp&rsquo; below and we&rsquo;ll help you out.</span>
                    </li>
                  </>
                ) : (
                  selected.directions.map((d, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[#4a4a50] leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-[#f0f0f1] text-[#0d0d0d] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {d}
                    </li>
                  ))
                )}
              </ol>
            </motion.div>
          </section>

          {error && (
            <div className="rounded-2xl bg-[#0d0d0d] text-white px-5 py-4 text-sm flex items-start gap-3">
              <span className="font-medium shrink-0">Could not place order</span>
              <span className="text-white/70">{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0d0d0d] text-white rounded-full py-4 text-sm font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              {submitting ? 'Placing your order…' : `Place order — KES ${grandTotal.toLocaleString()}`}
            </button>
            <button
              type="button"
              onClick={openWhatsAppInquiry}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-white text-[#0d0d0d] border border-black/10 rounded-full py-4 text-sm font-medium hover:bg-black/5 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Inquire on WhatsApp
            </button>
          </div>
          <p className="text-center text-xs text-black/45">
            Your order opens for payment after placing — you can pay via M-Pesa, PayPal, card or cash on
            delivery. WhatsApp is only for enquiries.
          </p>
        </form>

        {/* Summary */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-[#f0f0f1] rounded-3xl p-8 lg:sticky lg:top-28"
        >
          <h2 className="text-xl font-semibold mb-6">Your order</h2>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex gap-4 items-center">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#e3e3e5] shrink-0">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  <span className="absolute -top-0 -right-0 w-5 h-5 rounded-full bg-[#0d0d0d] text-white text-[10px] font-bold flex items-center justify-center">
                    {item.qty}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-black/50">Size: {item.size}</p>
                </div>
                <span className="text-sm font-semibold">KES {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-black/10 mt-6 pt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-black/60">Subtotal</span>
              <span className="font-semibold">KES {cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Delivery</span>
              <span className="font-semibold">{deliveryFee === 0 ? 'Free' : `KES ${deliveryFee.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t border-black/10">
              <span className="font-semibold">Total</span>
              <span className="font-bold">KES {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-6 space-y-2.5 text-xs text-black/55">
            <p className="flex items-center gap-2"><Truck className="w-4 h-4" /> Delivery countrywide, 1–3 days</p>
            <p className="flex items-center gap-2"><Lock className="w-4 h-4" /> All communication via WhatsApp</p>
          </div>

          <Link href="/cart" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-black/60 hover:text-[#0d0d0d] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to cart
          </Link>
        </motion.aside>
      </div>
    </div>
  );
}
