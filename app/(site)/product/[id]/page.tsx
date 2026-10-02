'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingBag, Check, ShieldCheck, Truck, MessageCircle } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/ProductCard';

/** Hard ceiling per order line, matching the server's own limit. */
const MAX_QTY = 10;

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const product = PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

  const [mainImg, setMainImg] = useState(product.img);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [qty, setQty] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  // Per-size stock arrives from the database after mount; until then we assume the
  // size is buyable so the page is usable on a slow connection.
  const [sizeStock, setSizeStock] = useState<Record<string, number> | null>(null);

  const { addToCart, openCart } = useCart();

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/storefront')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.stock) return;
        const stock = data.stock[product.id]?.sizeStock ?? null;
        setSizeStock(stock);
        // The first size is selected before stock loads, so it can land on one that
        // is sold out. Move to the first size that is actually buyable.
        if (stock) {
          setSelectedSize((current) => {
            const units = stock[current];
            if (units == null || units > 0) return current;
            return product.sizes.find((s) => (stock[s] ?? 0) > 0) ?? current;
          });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [product.id, product.sizes]);

  const unitsIn = (size: string) => {
    if (!sizeStock) return null;
    const value = sizeStock[size];
    return value == null ? null : Math.max(0, value);
  };

  const selectedUnits = unitsIn(selectedSize);
  const maxQty = selectedUnits == null ? MAX_QTY : Math.max(1, Math.min(MAX_QTY, selectedUnits));
  // Nothing buyable at all — say so rather than letting the button fail server-side.
  const soldOut = sizeStock !== null && product.sizes.every((s) => (sizeStock[s] ?? 0) <= 0);

  const handleAddToCart = () => {
    if (soldOut) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      img: mainImg,
      size: selectedSize,
      qty,
    });
    openCart();
  };

  const handleWhatsAppBuy = () => {
    const text = encodeURIComponent(
      `Hello Mkurugenzi, I would like to order:\nProduct: ${product.name}\nSize: ${selectedSize}\nQuantity: ${qty}\nPrice: KES ${(product.price * qty).toLocaleString()}`
    );
    window.open(`https://wa.me/254716265661?text=${text}`, '_blank');
  };

  const relatedProducts = PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);

  return (
    <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10 space-y-24">

      {/* Product Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start pt-8">

        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-[#f0f0f1]">
            <img src={mainImg} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div className="flex gap-3">
            {[product.img, product.hoverImg].filter(Boolean).map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImg(img as string)}
                className={`w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all bg-[#f0f0f1] ${
                  mainImg === img ? 'border-[#0d0d0d]' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img as string} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Meta & Actions */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {product.badge && (
                <span className="inline-flex items-center bg-[#0d0d0d] text-white text-[13px] font-medium px-4 py-1.5 rounded-full">
                  {product.badge}
                </span>
              )}
              <span className="text-sm text-black/50 capitalize">{product.category}</span>
            </div>
            <h1 className="section-heading text-4xl sm:text-5xl">{product.name}</h1>
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-2xl font-semibold text-[#0d0d0d]">
                KES {product.price.toLocaleString()}
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-black/35 line-through">
                  KES {product.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <p className="text-[#4a4a50] text-base leading-relaxed border-t border-b border-black/10 py-6">
            {product.description}
          </p>

          {/* Size Selector */}
          <div>
            <div className="flex items-center justify-between text-sm font-medium mb-3 text-[#0d0d0d]">
              <span>Select size</span>
              <button
                onClick={() => setShowSizeGuide(!showSizeGuide)}
                className="text-black/50 hover:text-[#0d0d0d] underline"
              >
                Size guide
              </button>
            </div>

            {showSizeGuide && (
              <div className="mb-4 p-5 rounded-2xl bg-[#f0f0f1] text-sm text-[#4a4a50] space-y-1">
                <p>• Small: Chest 38-40in</p>
                <p>• Medium: Chest 40-42in</p>
                <p>• Large: Chest 42-44in</p>
                <p>• XL: Chest 44-46in</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5">
              {product.sizes.map((s) => {
                const units = unitsIn(s);
                const soldOut = units === 0;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (soldOut) return;
                      setSelectedSize(s);
                      setQty(1);
                    }}
                    disabled={soldOut}
                    title={soldOut ? 'Sold out' : undefined}
                    aria-label={soldOut ? `${s}, sold out` : `Size ${s}`}
                    className={`min-w-[56px] h-12 rounded-full text-sm font-medium border transition-all ${
                      soldOut
                        ? 'bg-[#f0f0f1] text-black/25 border-black/5 cursor-not-allowed line-through'
                        : selectedSize === s
                          ? 'bg-[#0d0d0d] text-white border-[#0d0d0d]'
                          : 'bg-white text-[#0d0d0d] border-black/10 hover:border-black/40'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            {selectedUnits != null && (
              <p className="mt-3 text-xs text-black/50">
                {soldOut
                  ? 'Every size is sold out right now — check back soon or ask us to hold one.'
                  : selectedUnits === 0
                    ? `Size ${selectedSize} has sold out — please pick another size.`
                    : selectedUnits <= 3
                      ? `Only ${selectedUnits} left in size ${selectedSize}.`
                      : `${selectedUnits} available in size ${selectedSize}.`}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <span className="text-sm font-medium block mb-3 text-[#0d0d0d]">Quantity</span>
            <div className="flex items-center border border-black/10 rounded-full bg-white w-fit">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-12 h-12 text-lg flex items-center justify-center text-black/60 hover:text-black"
              >
                −
              </button>
              <span className="w-10 text-center font-medium text-sm">{qty}</span>
              <button
                onClick={() => setQty(Math.min(maxQty, qty + 1))}
                disabled={qty >= maxQty}
                className="w-12 h-12 text-lg flex items-center justify-center text-black/60 hover:text-black disabled:text-black/20 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={soldOut}
              className="flex-1 py-4 bg-[#0d0d0d] hover:bg-[#2a2a2a] text-white font-medium text-sm rounded-full transition-colors flex items-center justify-center gap-2 disabled:bg-black/25 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              {soldOut ? 'Sold out' : 'Add to cart'}
            </button>

            <button
              onClick={handleWhatsAppBuy}
              className="flex-1 py-4 bg-white hover:bg-black/5 text-[#0d0d0d] font-medium text-sm rounded-full border border-black/10 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Inquire on WhatsApp
            </button>
          </div>

          {/* Highlights */}
          <div className="border-t border-black/10 pt-6 space-y-3 text-sm text-[#4a4a50]">
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-[#0d0d0d]" />
              <span>450GSM heavyweight premium fleece cotton</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-[#0d0d0d]" />
              <span>Express same-day / next-day delivery in Nairobi</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#0d0d0d]" />
              <span>Pre-shrunk fabric to prevent color fading and shrinkage</span>
            </div>
          </div>

        </div>

      </div>

      {/* Related Products */}
      <div className="border-t border-black/10 pt-16">
        <h2 className="section-heading text-4xl sm:text-5xl mb-10">You may also like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {relatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

    </div>
  );
}
