'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search, X } from 'lucide-react';

/* ----------------------------- Surfaces ----------------------------- */

export function Panel({
  children, className = '', pad = true,
}: { children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <div className={`bg-white border border-black/5 rounded-2xl ${pad ? 'p-6 lg:p-7' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title, sub, action,
}: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {sub && <p className="text-sm text-black/45 mt-1">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------ Stats ------------------------------- */

export function StatCard({
  label, value, sub, icon: Icon, tone = 'light',
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <div className={`rounded-2xl border p-6 ${dark ? 'bg-[#0d0d0d] text-white border-[#0d0d0d]' : 'bg-white border-black/5'}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-white/10 text-white' : 'bg-[#f0f0f1] text-[#0d0d0d]'}`}>
          <Icon className="w-5 h-5" />
        </span>
        <span className={`text-[11px] uppercase tracking-wider ${dark ? 'text-white/50' : 'text-black/40'}`}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className={`text-xs mt-1 ${dark ? 'text-white/45' : 'text-black/40'}`}>{sub}</p>}
    </div>
  );
}

/* ------------------------------ Chips ------------------------------- */

export function Badge({
  children, className = '', dot = false,
}: { children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${className || 'bg-[#f0f0f1] text-black/60'}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ----------------------------- Buttons ------------------------------- */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'dark' | 'light' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({
  variant = 'dark', size = 'md', className = '', children, ...rest
}: BtnProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none';
  const sizes = size === 'sm' ? 'text-xs px-3.5 py-2' : 'text-sm px-5 py-2.5';
  const variants = {
    dark: 'bg-[#0d0d0d] text-white hover:bg-[#2a2a2a] active:scale-[0.98]',
    light: 'bg-white text-[#0d0d0d] border border-black/10 hover:bg-black/5 active:scale-[0.98]',
    ghost: 'bg-transparent text-black/60 border border-black/10 hover:border-black/30 hover:text-[#0d0d0d]',
    danger: 'bg-transparent text-black/60 border border-black/10 hover:border-[#0d0d0d] hover:bg-[#0d0d0d] hover:text-white',
  }[variant];

  return (
    <button className={`${base} ${sizes} ${variants} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ------------------------------ Inputs ------------------------------ */

const fieldBase =
  'w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-all placeholder:text-black/30 focus:border-[#0d0d0d]';

export function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-black/50 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-black/35 mt-1.5">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldBase} ${props.className || ''}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldBase} resize-none ${props.className || ''}`} />;
}

/** Custom animated dropdown — a native <select> renders the OS blue menu. */
export function Select({
  value, onChange, options, className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${fieldBase} flex items-center justify-between text-left`}
      >
        <span className={current ? '' : 'text-black/30'}>{current?.label ?? 'Select'}</span>
        <ChevronDown className={`w-4 h-4 text-black/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-40 mt-2 w-full bg-white border border-black/10 rounded-xl overflow-hidden shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]"
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-[#f0f0f1] transition-colors"
              >
                {o.label}
                {o.value === value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SearchInput({
  value, onChange, placeholder = 'Search',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-11"
      />
    </div>
  );
}

export function Toggle({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 text-left py-3"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-black/40 mt-0.5">{hint}</span>}
      </span>
      <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-[#0d0d0d]' : 'bg-black/15'}`}>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
          style={{ left: checked ? 22 : 2 }}
        />
      </span>
    </button>
  );
}

/* ------------------------------ Modal ------------------------------- */

export function Modal({
  open, onClose, title, children, footer, wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} bg-white rounded-2xl border border-black/5 my-auto`}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
              <h3 className="font-bold">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full flex items-center justify-center text-black/40 hover:bg-[#f0f0f1] hover:text-[#0d0d0d] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-6">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-black/5 bg-[#fafafa] rounded-b-2xl">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------- Misc bits ----------------------------- */

export function EmptyState({
  icon: Icon, title, sub, action,
}: { icon: React.ComponentType<{ className?: string }>; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16">
      <span className="w-12 h-12 rounded-2xl bg-[#f0f0f1] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-5 h-5 text-black/50" />
      </span>
      <p className="font-medium">{title}</p>
      {sub && <p className="text-sm text-black/40 mt-1">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Horizontally scrollable table container that keeps its own gutter. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto px-6 lg:px-7 pb-6">
      <div className="min-w-full">{children}</div>
    </div>
  );
}

export function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left text-[11px] uppercase tracking-wider text-black/40 font-medium py-3 pr-4 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`py-4 pr-4 align-middle text-sm ${className}`}>{children}</td>;
}
