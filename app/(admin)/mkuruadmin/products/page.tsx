'use client';

import React from 'react';
import {
  Package, Plus, Pencil, Archive, Search as SearchIcon, LayoutGrid, Rows3, Trash2, RotateCcw,
  Camera, Loader2,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  Badge, Button, EmptyState, Field, Input, Modal, Panel, SearchInput, SectionHeader,
  Select, TableWrap, Td, Th, Textarea,
} from '../components/ui';
import ImagePicker from '../components/ImagePicker';
import { useImageUpload } from '../components/useImageUpload';
import type { Product, ProductStatus } from '@/lib/types';
import { KES, PRODUCT_STATUS, slugify } from '@/lib/seed';

const CATEGORY_OPTIONS = [
  { value: 'gents', label: 'Gents' },
  { value: 'ladies', label: 'Ladies' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'accessories', label: 'Accessories' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const SIZE_PRESETS = ['S', 'M', 'L', 'XL', 'XXL', 'One size'];

const blankProduct = (): Product => ({
  id: '',
  slug: '',
  name: '',
  category: 'unisex',
  price: 0,
  stock: 0,
  sold: 0,
  sizes: ['One size'],
  status: 'draft',
  img: '/assets/images/Mkurugenzi-Merch/black-1-of-1-150x150.png',
  description: '',
});

export default function AdminProductsPage() {
  const { products, save, remove, settings } = useAdmin();
  const lowStockLimit = settings.lowStockAlert || 10;

  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [view, setView] = React.useState<'grid' | 'table'>('grid');
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (status !== 'all' && p.status !== status) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, category, status]);

  /** Applies a change to one product without opening the editor. */
  const patch = async (id: string, part: Partial<Product>, message?: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    await save('products', { ...target, ...part });
    if (message) notify(message);
  };

  const submit = async () => {
    if (!editing?.name.trim()) return;
    setBusy(true);
    try {
      const record: Product = {
        ...editing,
        id: editing.id || `p_${Math.random().toString(36).slice(2, 8)}`,
        slug: editing.slug?.trim() || slugify(editing.name),
      };
      await save('products', record);
      setEditing(null);
      notify('Product saved');
    } catch {
      notify('Could not save the product');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toast message={toast} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-heading text-3xl sm:text-4xl">Products</h1>
          <p className="text-sm text-black/50 mt-1">
            {products.length} items &middot; {filtered.length} shown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-black/10 p-1">
            {([['grid', LayoutGrid], ['table', Rows3]] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                aria-label={`${mode} view`}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  view === mode ? 'bg-[#0d0d0d] text-white' : 'text-black/40 hover:text-[#0d0d0d]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <Button onClick={() => setEditing(blankProduct())}>
            <Plus className="w-4 h-4" /> New product
          </Button>
        </div>
      </div>

      <Panel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search products" />
          <Select
            value={category}
            onChange={setCategory}
            options={[{ value: 'all', label: 'All categories' }, ...CATEGORY_OPTIONS]}
          />
          <Select
            value={status}
            onChange={setStatus}
            options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS]}
          />
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <Panel>
          <EmptyState
            icon={products.length ? SearchIcon : Package}
            title={products.length ? 'No products match' : 'No products yet'}
            sub={products.length ? 'Try a different search term or filter.' : 'Add your first product to start selling.'}
            action={!products.length && <Button onClick={() => setEditing(blankProduct())}><Plus className="w-4 h-4" /> New product</Button>}
          />
        </Panel>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filtered.map((p) => {
            const meta = PRODUCT_STATUS[p.status];
            return (
              <div key={p.id} className="bg-white border border-black/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="relative aspect-[4/5] bg-[#f0f0f1]">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3"><Badge className={meta.chip}>{meta.label}</Badge></div>
                  {p.badge && <div className="absolute top-3 right-3"><Badge className="bg-white text-[#0d0d0d]">{p.badge}</Badge></div>}

                  {/* Change the photo straight from the card — no need to open the editor. */}
                  <PhotoButton onSave={(url) => void patch(p.id, { img: url }, 'Photo updated')} />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="font-medium leading-snug">{p.name}</p>
                  <p className="text-xs text-black/40 mt-1 capitalize">{p.category}</p>
                  <p className="text-sm font-semibold mt-3">{KES(p.price)}</p>
                  <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-black/5">
                    <span className={`text-xs ${p.stock <= lowStockLimit ? 'text-black/60 font-medium' : 'text-black/40'}`}>
                      {p.stock} in stock
                    </span>
                    <div className="flex items-center gap-1">
                      <IconBtn label="Add 10 to stock" onClick={() => void patch(p.id, { stock: p.stock + 10 }, 'Stock updated')}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn label="Edit" onClick={() => setEditing(p)}><Pencil className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn
                        label={p.status === 'archived' ? 'Restore' : 'Archive'}
                        onClick={() => void patch(p.id, { status: p.status === 'archived' ? 'active' : 'archived' } as Partial<Product>, 'Status updated')}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </IconBtn>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Panel pad={false}>
          <div className="px-6 lg:px-7 pt-6 lg:pt-7">
            <SectionHeader title="Catalogue" sub="Edit stock inline, everything else in the editor" />
          </div>
          <TableWrap>
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5">
                  <Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>Stock</Th><Th>Sold</Th><Th>Status</Th><Th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const meta = PRODUCT_STATUS[p.status];
                  return (
                    <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-colors">
                      <Td>
                        <div className="flex items-center gap-3">
                          <img src={p.img} alt="" className="h-10 w-10 rounded-lg object-cover bg-[#f0f0f1] shrink-0" />
                          <span className="font-medium">{p.name}</span>
                          <PhotoButton onSave={(url) => void patch(p.id, { img: url }, 'Photo updated')} inline />
                        </div>
                      </Td>
                      <Td className="text-black/50 capitalize">{p.category}</Td>
                      <Td className="whitespace-nowrap">{KES(p.price)}</Td>
                      <Td>
                        <input
                          type="number"
                          min={0}
                          defaultValue={p.stock}
                          onBlur={(e) => {
                            const next = Math.max(0, Number(e.target.value) || 0);
                            if (next !== p.stock) void patch(p.id, { stock: next });
                          }}
                          className="w-20 rounded-lg border border-black/10 px-2 py-1 text-sm outline-none focus:border-[#0d0d0d] transition-colors"
                        />
                      </Td>
                      <Td className="text-black/50">{p.sold}</Td>
                      <Td><Badge className={meta.chip}>{meta.label}</Badge></Td>
                      <Td>
                        <div className="flex items-center gap-1 justify-end">
                          <IconBtn label="Edit" onClick={() => setEditing(p)}><Pencil className="w-3.5 h-3.5" /></IconBtn>
                          <IconBtn label="Delete" danger onClick={() => void remove('products', p.id).then(() => notify('Product deleted'))}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </IconBtn>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id && products.some((p) => p.id === editing.id) ? 'Edit product' : 'New product'}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void submit()} disabled={!editing?.name.trim() || busy}>
              {busy ? 'Saving…' : 'Save product'}
            </Button>
          </>
        }
      >
        {editing && <ProductEditor draft={editing} onChange={setEditing} lowStockLimit={lowStockLimit} />}
      </Modal>
    </div>
  );
}

function ProductEditor({
  draft, onChange, lowStockLimit,
}: { draft: Product; onChange: (next: Product) => void; lowStockLimit: number }) {
  const patch = (part: Partial<Product>) => onChange({ ...draft, ...part });

  return (
    <div className="space-y-5">
      <Field label="Product name">
        <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Hoodie – Mkurugenzi" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Category">
          <Select value={draft.category} onChange={(v) => patch({ category: v as Product['category'] })} options={CATEGORY_OPTIONS} />
        </Field>
        <Field label="Status">
          <Select value={draft.status} onChange={(v) => patch({ status: v as ProductStatus })} options={STATUS_OPTIONS} />
        </Field>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field label="Price (KES)">
          <Input type="number" min={0} value={draft.price} onChange={(e) => patch({ price: Math.max(0, Number(e.target.value) || 0) })} />
        </Field>
        <Field label="Compare at">
          <Input type="number" min={0} value={draft.compareAtPrice ?? ''} onChange={(e) => patch({ compareAtPrice: e.target.value ? Number(e.target.value) : undefined })} placeholder="—" />
        </Field>
        <Field label="Stock" hint="Fallback used for sizes with no row below.">
          <Input type="number" min={0} value={draft.stock} onChange={(e) => patch({ stock: Math.max(0, Number(e.target.value) || 0) })} />
        </Field>
        <Field label="Units sold">
          <Input type="number" min={0} value={draft.sold} onChange={(e) => patch({ sold: Math.max(0, Number(e.target.value) || 0) })} />
        </Field>
      </div>

      <Field label="Sizes" hint="Tap to toggle. Leave all unticked for a one-size product.">
        <div className="flex flex-wrap gap-2">
          {SIZE_PRESETS.map((s) => {
            const on = draft.sizes.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  const nextSizes = on ? draft.sizes.filter((x) => x !== s) : [...draft.sizes, s];
                  // A newly ticked size starts at the current total so nothing looks
                  // accidentally sold out the moment it is added.
                  const nextStock = { ...(draft.sizeStock ?? {}) };
                  if (!on && nextStock[s] == null) nextStock[s] = draft.stock;
                  patch({ sizes: nextSizes, sizeStock: nextStock });
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all ${on ? 'bg-[#0d0d0d] text-white border-[#0d0d0d]' : 'bg-white text-black/50 border-black/10 hover:border-black/30'}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Stock per size"
        hint="One row per size. This is what stops you selling a size you have run out of."
      >
        {draft.sizes.length === 0 ? (
          <p className="text-sm text-black/35">Add a size above to track its stock separately.</p>
        ) : (
          <div className="space-y-2">
            {draft.sizes.map((size) => {
              const units = draft.sizeStock?.[size] ?? draft.stock;
              const low = units <= lowStockLimit;
              return (
                <div key={size} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-sm font-medium">{size}</span>
                  <Input
                    type="number"
                    min={0}
                    value={units}
                    onChange={(e) => {
                      const next = Math.max(0, Number(e.target.value) || 0);
                      patch({
                        sizeStock: { ...(draft.sizeStock ?? {}), [size]: next },
                        stock: draft.sizes.reduce(
                          (sum, s) => sum + (s === size ? next : (draft.sizeStock?.[s] ?? draft.stock)),
                          0,
                        ),
                      });
                    }}
                    className="max-w-[120px]"
                  />
                  <div className="flex items-center gap-1">
                    {[5, 10].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => {
                          const next = Math.max(0, units + step);
                          patch({
                            sizeStock: { ...(draft.sizeStock ?? {}), [size]: next },
                            stock: draft.sizes.reduce(
                              (sum, s) => sum + (s === size ? next : (draft.sizeStock?.[s] ?? draft.stock)),
                              0,
                            ),
                          });
                        }}
                        className="rounded-full border border-black/10 px-2.5 py-1 text-[11px] font-medium text-black/50 hover:border-black/30 hover:text-[#0d0d0d] transition-colors"
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                  <span className={`text-xs ${units === 0 ? 'text-black/40' : low ? 'text-black/60 font-medium' : 'text-black/35'}`}>
                    {units === 0 ? 'Sold out' : low ? 'Low' : `${units} in stock`}
                  </span>
                </div>
              );
            })}
            <p className="text-xs text-black/40 pt-1">
              Total across all sizes is kept in sync with the Stock field above.
            </p>
          </div>
        )}
      </Field>

      <Field label="Badge" hint="Shown on the product card, e.g. New or Sold out.">
        <Input value={draft.badge ?? ''} onChange={(e) => patch({ badge: e.target.value })} placeholder="New" />
      </Field>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ImagePicker
          label="Main image"
          value={draft.img}
          onChange={(url) => patch({ img: url })}
          hint="Uploaded files are stored in /uploads and can be shared as a link."
        />
        <ImagePicker
          label="Hover image"
          value={draft.hoverImg ?? ''}
          onChange={(url) => patch({ hoverImg: url || undefined })}
          hint="Optional — the second image shown when a shopper hovers the card."
        />
      </div>

      <Field label="Description">
        <Textarea rows={4} value={draft.description} onChange={(e) => patch({ description: e.target.value })} placeholder="Describe the fabric, fit and care." />
      </Field>
    </div>
  );
}

/**
 * One-click photo upload attached to a product card (or table row). Saves
 * straight away, so swapping a picture never means opening the editor.
 */
function PhotoButton({
  onSave, inline = false,
}: {
  onSave: (url: string) => void;
  inline?: boolean;
}) {
  const [preview, setPreview] = React.useState<string | null>(null);

  // The parent owns persistence, so an uploaded photo is written the same way as
  // any other inline edit (optimistic save, toast, rollback on failure).
  const { open, upload, inputProps, busy, error } = useImageUpload((url) => {
    setPreview(null);
    onSave(url);
  });

  return (
    <>
      <input
        {...inputProps}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPreview(URL.createObjectURL(file));
          void upload(file);
        }}
      />
      <button
        type="button"
        onClick={open}
        disabled={busy}
        title={busy ? 'Uploading…' : 'Change photo'}
        aria-label={busy ? 'Uploading photo' : 'Change photo'}
        className={
          inline
            ? 'ml-auto w-8 h-8 rounded-full flex items-center justify-center text-black/35 hover:bg-[#f0f0f1] hover:text-[#0d0d0d] transition-colors shrink-0 disabled:opacity-50'
            : 'absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-3.5 py-2 text-xs font-medium text-[#0d0d0d] shadow-md transition-all hover:bg-white active:scale-95 disabled:opacity-70'
        }
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {inline ? null : busy ? 'Uploading…' : 'Photo'}
      </button>
      {error && (
        <p className="absolute bottom-3 left-3 right-3 z-10 rounded-lg bg-[#0d0d0d] text-white text-[11px] px-3 py-2">
          {error}
        </p>
      )}
      {preview && (
        <img
          src={preview}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
      )}
    </>
  );
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full bg-[#0d0d0d] text-white text-sm shadow-[0_18px_40px_-20px_rgba(0,0,0,0.5)]">
      {message}
    </div>
  );
}

function IconBtn({
  children, label, onClick, danger = false,
}: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${danger ? 'text-black/30 hover:bg-[#0d0d0d] hover:text-white' : 'text-black/40 hover:bg-[#f0f0f1] hover:text-[#0d0d0d]'}`}
    >
      {children}
    </button>
  );
}
