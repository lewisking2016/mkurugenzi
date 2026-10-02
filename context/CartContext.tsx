'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  img: string;
  size: string;
  qty: number;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  img: string;
}

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQty: (id: string, size: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  checkoutWhatsApp: () => void;
  wishlist: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  wishlistCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mk_next_cart');
      if (saved) setCart(JSON.parse(saved));
      const savedWishlist = localStorage.getItem('mk_next_wishlist');
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mk_next_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('mk_next_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const index = prev.findIndex((i) => i.id === newItem.id && i.size === newItem.size);
      if (index > -1) {
        const updated = [...prev];
        updated[index].qty += newItem.qty;
        return updated;
      }
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string, size: string) => {
    setCart((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
  };

  const updateQty = (id: string, size: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id && item.size === size) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const checkoutWhatsApp = () => {
    if (cart.length === 0) return;
    let text = `*NEW ORDER — MKURUGENZI STORES*\n\n`;
    cart.forEach((item, idx) => {
      text += `${idx + 1}. *${item.name}* (Size: ${item.size}) x${item.qty} — KES ${(item.price * item.qty).toLocaleString()}\n`;
    });
    text += `\n*TOTAL:* KES ${cartTotal.toLocaleString()}\n\n_Please confirm availability & delivery details._`;
    window.open(`https://wa.me/254716265661?text=${encodeURIComponent(text)}`, '_blank');
  };

  // ── Wishlist ────────────────────────────────────────────────────────────
  const toggleWishlist = (item: WishlistItem) => {
    setWishlist((prev) => {
      const exists = prev.some((w) => w.id === item.id);
      if (exists) return prev.filter((w) => w.id !== item.id);
      return [...prev, item];
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  };

  const isWishlisted = (id: string) => wishlist.some((w) => w.id === id);

  const wishlistCount = wishlist.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        cartTotal,
        checkoutWhatsApp,
        wishlist,
        toggleWishlist,
        removeFromWishlist,
        isWishlisted,
        wishlistCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
