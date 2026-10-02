'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, closeCart, cart, removeFromCart, updateQty, cartTotal, checkoutWhatsApp } = useCart();

  // Read the threshold from the store settings rather than guessing, so the
  // progress bar agrees with what checkout will actually charge.
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = React.useState(3000);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/storefront')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.freeDeliveryThreshold) setFreeDeliveryThreshold(data.freeDeliveryThreshold);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const progress = Math.min(100, (cartTotal / freeDeliveryThreshold) * 100);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[9995] w-full max-w-md bg-[#fafafa] border-l border-black/10 text-[#0d0d0d] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-black/10">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-[#0d0d0d] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </span>
                <h2 className="text-lg font-bold tracking-wide uppercase text-[#0d0d0d]">Your Cart</h2>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center text-[#0d0d0d] hover:bg-[#0d0d0d] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Free delivery progress */}
            {cart.length > 0 && (
              <div className="px-6 pt-5">
                <p className="text-[13px] text-[#4a4a50] mb-2">
                  {cartTotal >= freeDeliveryThreshold ? (
                    <>You&rsquo;ve unlocked <strong className="text-[#0d0d0d]">free delivery</strong>.</>
                  ) : (
                    <>Spend <strong className="text-[#0d0d0d]">KES {(freeDeliveryThreshold - cartTotal).toLocaleString()}</strong> more for free delivery.</>
                  )}
                </p>
                <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0d0d0d] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <span className="w-16 h-16 rounded-full bg-[#f0f0f1] flex items-center justify-center mx-auto mb-5">
                    <ShoppingBag className="w-6 h-6 text-[#4a4a50]" />
                  </span>
                  <p className="text-sm font-semibold text-[#0d0d0d]">Your cart is currently empty.</p>
                  <button
                    onClick={closeCart}
                    className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0d0d0d] text-white text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                  >
                    Continue shopping
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-black/5"
                  >
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-20 h-24 object-cover rounded-xl bg-[#f0f0f1] flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate text-[#0d0d0d]">{item.name}</h4>
                      <p className="text-xs text-[#4a4a50] mt-1 font-medium">Size: {item.size}</p>
                      <p className="text-sm font-bold text-[#0d0d0d] mt-1">
                        KES {(item.price * item.qty).toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-black/10 rounded-full bg-white">
                          <button
                            onClick={() => updateQty(item.id, item.size, -1)}
                            aria-label="Decrease quantity"
                            className="p-1.5 pl-2.5 text-[#4a4a50] hover:text-[#0d0d0d]"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-bold">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.size, 1)}
                            aria-label="Increase quantity"
                            className="p-1.5 pr-2.5 text-[#4a4a50] hover:text-[#0d0d0d]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id, item.size)}
                          aria-label="Remove item"
                          className="text-black/40 hover:text-[#0d0d0d] p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-black/10 bg-white">
                <div className="flex items-center justify-between text-base font-bold mb-4">
                  <span className="text-[#4a4a50] font-medium">Subtotal</span>
                  <span className="text-[#0d0d0d] text-xl font-black">KES {cartTotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-[#4a4a50] mb-4">Delivery calculated at checkout.</p>

                {/* Checkout is the real path — it creates the order in the store. */}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="btn-pill-dark w-full justify-center py-4 uppercase tracking-[0.15em] text-xs"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* WhatsApp is a way to talk to us, not a way to pay. */}
                <button
                  onClick={() => {
                    closeCart();
                    checkoutWhatsApp();
                  }}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 text-xs font-medium text-black/50 hover:text-[#0d0d0d] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Questions? Chat with us on WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
