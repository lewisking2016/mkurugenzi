'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, MessageCircle, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { cart, updateQty, removeFromCart, cartTotal, checkoutWhatsApp, clearCart } = useCart();

  // Delivery pricing comes from the store settings so this total matches what
  // checkout actually charges.
  const [fees, setFees] = React.useState({
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

  const deliveryFee =
    cartTotal > 0 && cartTotal < fees.freeDeliveryThreshold ? fees.deliveryFeeNairobi : 0;
  const grandTotal = cartTotal + deliveryFee;

  return (
    <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-5 pt-16 pb-16">
        <div className="pill-tag justify-center mb-2">
          <span className="pill-tag-icon">
            <img
              src="/assets/images/Mkurugenzi – Merch/black-1-of-1-150x150.png"
              alt="Mkurugenzi logo"
              className="w-5 h-5 object-contain brightness-0 invert"
            />
          </span>
          Merch Shop
        </div>
        <h1 className="section-heading text-6xl sm:text-7xl">Your Cart</h1>
      </div>

      {cart.length === 0 ? (
        /* Empty state — mirrors mkurugenzi.ke "Your cart is currently empty" */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 bg-[#f0f0f1] rounded-3xl"
        >
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-black/40" />
          </div>
          <h2 className="text-2xl font-semibold text-[#0d0d0d] mb-2">Your cart is currently empty</h2>
          <p className="text-black/50 mb-8">Browse the collection and add some pieces you love.</p>
          <Link href="/shop" className="btn-pill-dark">
            Return to shop <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-5">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div
                  key={`${item.id}-${item.size}`}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="flex gap-5 bg-[#f0f0f1] rounded-3xl p-4 sm:p-5"
                >
                  <Link
                    href={`/product/${item.id}`}
                    className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden bg-[#e3e3e5] shrink-0"
                  >
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </Link>

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/product/${item.id}`}>
                          <h3 className="font-semibold text-[#0d0d0d] leading-snug hover:opacity-60 transition-opacity">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-black/50 mt-1">Size: {item.size}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center text-black/50 hover:text-red-600 hover:border-red-200 transition-colors shrink-0"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center bg-white border border-black/10 rounded-full">
                        <button
                          onClick={() => updateQty(item.id, item.size, -1)}
                          className="w-9 h-9 flex items-center justify-center text-black/60 hover:text-black"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.size, 1)}
                          className="w-9 h-9 flex items-center justify-center text-black/60 hover:text-black"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-lg font-bold text-[#0d0d0d]">
                        KES {(item.price * item.qty).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-medium text-black/60 hover:text-[#0d0d0d] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Continue shopping
              </Link>
              <button
                onClick={clearCart}
                className="text-sm font-medium text-black/60 hover:text-red-600 transition-colors"
              >
                Clear cart
              </button>
            </div>
          </div>

          {/* Order summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#f0f0f1] rounded-3xl p-8 lg:sticky lg:top-28"
          >
            <h2 className="text-2xl font-semibold text-[#0d0d0d] mb-6">Order summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-black/60">Subtotal</span>
                <span className="font-semibold">KES {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">Delivery</span>
                <span className="font-semibold">
                  {deliveryFee === 0 ? 'Free' : `KES ${deliveryFee.toLocaleString()}`}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs text-black/45 leading-relaxed">
                  Free delivery on orders above KES {fees.freeDeliveryThreshold.toLocaleString()} within Nairobi.
                </p>
              )}
              <div className="border-t border-black/10 pt-4 flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold">KES {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-[#0d0d0d] text-white rounded-full py-4 text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
            >
              Proceed to checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={checkoutWhatsApp}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 text-xs font-medium text-black/50 hover:text-[#0d0d0d] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Questions? Chat with us on WhatsApp
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
