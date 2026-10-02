'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Crown, Heart } from 'lucide-react';
import { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [activeImg, setActiveImg] = useState(product.img);
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const wishlisted = isWishlisted(product.id);

  const formatPrice = (n: number) => `KES ${n.toLocaleString()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group flex flex-col"
    >
      {/* Image tile */}
      <Link
        href={`/product/${product.id}`}
        className="group/img relative block overflow-hidden rounded-2xl bg-[#f0f0f1] aspect-[3/4]"
        onMouseEnter={() => product.hoverImg && setActiveImg(product.hoverImg)}
        onMouseLeave={() => setActiveImg(product.img)}
      >
        {/*
          The tile has a fixed ratio and the image is absolutely positioned, so
          swapping to the hover shot (which has different intrinsic dimensions)
          can never change the layout and shift the card.
        */}
        <img
          src={activeImg}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover/img:scale-110"
        />

        {/* Badge pill */}
        {product.badge && (
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-[#0d0d0d] text-white text-[13px] font-medium pl-3 pr-4 py-2 rounded-full">
            <Crown className="w-3.5 h-3.5" />
            {product.badge}
          </span>
        )}

        {/* Wishlist toggle — kept at the card's top-right on every breakpoint. */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({ id: product.id, name: product.name, price: product.price, img: product.img });
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
            wishlisted
              ? 'bg-[#0d0d0d] text-white'
              : 'bg-white/95 text-[#0d0d0d] hover:bg-white'
          }`}
        >
          <Heart className={`w-[18px] h-[18px] ${wishlisted ? 'fill-current' : ''}`} />
        </button>
      </Link>

      {/* Info row */}
      <div className="flex items-start justify-between pt-4">
        <div>
          <Link href={`/product/${product.id}`}>
            <h3 className="text-[17px] font-medium text-[#0d0d0d] leading-snug group-hover:opacity-60 transition-opacity">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-baseline gap-2.5 mt-1">
            <span className="text-[19px] font-semibold text-[#0d0d0d]">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-[15px] text-black/35 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail swatches */}
        <div className="flex items-center gap-2 pt-1">
          {[product.img, product.hoverImg].filter(Boolean).slice(0, 2).map((img, i) => (
            <button
              key={i}
              onMouseEnter={() => setActiveImg(img as string)}
              onClick={() => setActiveImg(img as string)}
              className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-colors bg-[#f0f0f1] ${
                activeImg === img ? 'border-[#0d0d0d]' : 'border-transparent hover:border-black/20'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <img src={img as string} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
