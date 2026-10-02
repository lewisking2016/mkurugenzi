'use client';

import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUpDown, Filter, X, RotateCcw, Check } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('cat') || 'all';

  const [category, setCategory] = useState<string>(initialCategory);
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'low' | 'high'>('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { id: 'featured' as const, label: 'Featured' },
    { id: 'low' as const, label: 'Price: Low to High' },
    { id: 'high' as const, label: 'Price: High to Low' },
  ];

  useEffect(() => {
    if (!sortOpen) return;
    const onClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSortOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [sortOpen]);

  const categories = [
    { id: 'all', label: 'All Products', count: PRODUCTS.length },
    { id: 'gents', label: 'Gents', count: PRODUCTS.filter((p) => p.category === 'gents').length },
    { id: 'ladies', label: 'Ladies', count: PRODUCTS.filter((p) => p.category === 'ladies').length },
    { id: 'unisex', label: 'Unisex', count: PRODUCTS.filter((p) => p.category === 'unisex').length },
    { id: 'accessories', label: 'Accessories', count: PRODUCTS.filter((p) => p.category === 'accessories').length },
  ];

  const sizes = ['all', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'ONE SIZE'];

  const priceRanges = [
    { id: 'all', label: 'All Prices' },
    { id: 'under3k', label: 'Under KES 3,000' },
    { id: '3k-7k', label: 'KES 3,000 – KES 7,000' },
    { id: 'above7k', label: 'Above KES 7,000' },
  ];

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchCat = category === 'all' || product.category === category;
      const matchSize = selectedSize === 'all' || product.sizes.includes(selectedSize);

      let matchPrice = true;
      if (priceRange === 'under3k') matchPrice = product.price < 3000;
      else if (priceRange === '3k-7k') matchPrice = product.price >= 3000 && product.price <= 7000;
      else if (priceRange === 'above7k') matchPrice = product.price > 7000;

      const matchQuery =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSize && matchPrice && matchQuery;
    }).sort((a, b) => {
      if (sortBy === 'low') return a.price - b.price;
      if (sortBy === 'high') return b.price - a.price;
      return 0;
    });
  }, [category, selectedSize, priceRange, searchQuery, sortBy]);

  const resetAllFilters = () => {
    setCategory('all');
    setSelectedSize('all');
    setPriceRange('all');
    setSearchQuery('');
    setSortBy('featured');
  };

  const hasActiveFilters =
    category !== 'all' || selectedSize !== 'all' || priceRange !== 'all' || searchQuery !== '';

  const FilterPanel = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-black/50 mb-4">Categories</h3>
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                category === cat.id
                  ? 'bg-[#0d0d0d] text-white'
                  : 'text-[#4a4a50] hover:bg-black/5'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-xs opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Size Filter */}
      <div className="border-t border-black/8 pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-black/50 mb-4">Size</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSize(s)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all border ${
                selectedSize === s
                  ? 'bg-[#0d0d0d] text-white border-[#0d0d0d]'
                  : 'bg-white text-[#4a4a50] border-black/10 hover:border-black/30'
              }`}
            >
              {s === 'all' ? 'All Sizes' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="border-t border-black/8 pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-black/50 mb-4">Price Range</h3>
        <div className="space-y-1.5">
          {priceRanges.map((pr) => (
            <button
              key={pr.id}
              onClick={() => setPriceRange(pr.id)}
              className={`w-full text-left px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                priceRange === pr.id ? 'bg-[#0d0d0d] text-white' : 'text-[#4a4a50] hover:bg-black/5'
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={resetAllFilters}
          className="w-full py-3 bg-white border border-black/10 text-[#0d0d0d] font-medium text-sm rounded-full transition-all flex items-center justify-center gap-2 hover:bg-black/5"
        >
          <RotateCcw className="w-4 h-4" />
          Reset all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10">

      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-5 mb-14">
        <div className="pill-tag justify-center">
          <span className="pill-tag-icon">
            <img
              src="/assets/images/Mkurugenzi-Merch/black-1-of-1-150x150.png"
              alt="Mkurugenzi logo"
              className="w-5 h-5 object-contain brightness-0 invert"
            />
          </span>
          Mkurugenzi Catalog
        </div>
        <h1 className="section-heading text-6xl sm:text-7xl">Shop all items</h1>
        <p className="text-[#4a4a50] text-base">
          Discover our 450GSM sweatsuits, quarter-zips, hoodies, track jackets, tote bags and accessories.
        </p>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-black/10 text-sm font-medium"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <span className="text-sm text-black/50">
            Showing <strong className="text-[#0d0d0d]">{filteredProducts.length}</strong> of {PRODUCTS.length} products
          </span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-black/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-black/10 text-sm focus:outline-none focus:border-black/40 transition-colors"
            />
          </div>

          <div className="relative flex-1 md:w-72" ref={sortRef}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 bg-white border border-black/10 text-sm font-medium rounded-full px-5 py-3 pr-4 focus:outline-none focus:border-black/40 cursor-pointer transition-colors hover:border-black/30"
            >
              <span className="text-[#0d0d0d]">{sortOptions.find((o) => o.id === sortBy)?.label}</span>
              <ArrowUpDown className={`w-3.5 h-3.5 text-black/40 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-full md:w-56 bg-white rounded-2xl shadow-xl shadow-black/10 border border-black/5 p-1.5 z-40"
                >
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSortBy(opt.id);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                        sortBy === opt.id
                          ? 'bg-[#0d0d0d] text-white'
                          : 'text-[#4a4a50] hover:bg-black/5'
                      }`}
                    >
                      {opt.label}
                      {sortBy === opt.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 items-start">
        <aside className="hidden md:block sticky top-28 bg-[#f0f0f1] p-7 rounded-3xl">
          <FilterPanel />
        </aside>

        <div className="md:col-span-3 space-y-8">
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {category !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0d0d0d] text-white text-[13px] font-medium">
                  {categories.find((c) => c.id === category)?.label}
                  <button onClick={() => setCategory('all')}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}
              {selectedSize !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0d0d0d] text-white text-[13px] font-medium">
                  Size: {selectedSize}
                  <button onClick={() => setSelectedSize('all')}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}
              {priceRange !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0d0d0d] text-white text-[13px] font-medium">
                  {priceRanges.find((p) => p.id === priceRange)?.label}
                  <button onClick={() => setPriceRange('all')}><X className="w-3.5 h-3.5" /></button>
                </span>
              )}
              <button onClick={resetAllFilters} className="text-[13px] font-medium underline ml-1">
                Clear all
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-[#f0f0f1] rounded-3xl">
              <p className="text-lg text-[#4a4a50] font-medium">No products match your selected filters.</p>
              <button onClick={resetAllFilters} className="mt-6 btn-pill-dark">
                Clear filters
              </button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-[#fafafa] rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto md:hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterPanel />
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full mt-8 py-4 bg-[#0d0d0d] text-white rounded-full font-medium"
            >
              Show {filteredProducts.length} items
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-black/50">Loading shop catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
