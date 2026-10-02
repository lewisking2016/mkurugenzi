'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/ProductCard';
import { PRODUCTS } from '@/data/products';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, toggleWishlist, addToCart, isWishlisted } = useCart();

  const wishlistProducts = PRODUCTS.filter((p) => isWishlisted(p.id));

  const handleMoveAllToCart = () => {
    wishlistProducts.forEach((p) => {
      addToCart({
        id: p.id,
        name: p.name,
        price: p.price,
        img: p.img,
        size: p.sizes[0] || 'ONE SIZE',
        qty: 1,
      });
    });
  };

  return (
    <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-5 pt-16 pb-14">
        <div className="pill-tag justify-center mb-2">
          <span className="pill-tag-icon">
            <img
              src="/assets/images/Mkurugenzi – Merch/black-1-of-1-150x150.png"
              alt="Mkurugenzi logo"
              className="w-5 h-5 object-contain brightness-0 invert"
            />
          </span>
          Saved pieces
        </div>
        <h1 className="section-heading text-6xl sm:text-7xl">Wishlist</h1>
        <p className="text-black/50">Pieces you love, saved for later.</p>
      </div>

      {wishlistProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 bg-[#f0f0f1] rounded-3xl"
        >
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-black/40" />
          </div>
          <h2 className="text-2xl font-semibold text-[#0d0d0d] mb-2">Your wishlist is empty</h2>
          <p className="text-black/50 mb-8">Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="btn-pill-dark">
            Explore the shop <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-10">
            <span className="text-sm text-black/50">
              {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
            </span>
            <button
              onClick={handleMoveAllToCart}
              className="inline-flex items-center gap-2 bg-[#0d0d0d] text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Move all to cart
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            <AnimatePresence>
              {wishlistProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="relative"
                >
                  <ProductCard product={product} />
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() =>
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          img: product.img,
                          size: product.sizes[0] || 'ONE SIZE',
                          qty: 1,
                        })
                      }
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0d0d0d] text-white rounded-full py-2.5 text-xs font-medium hover:bg-[#2a2a2a] transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Add to cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center text-black/50 hover:text-red-600 hover:border-red-200 transition-colors"
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
