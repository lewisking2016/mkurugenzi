'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, Lock, Mail, ArrowRight } from 'lucide-react';
import { Field, Input } from '../components/ui';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/mkuruadmin';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError((payload as { error?: string }).error || 'Could not sign in.');
        setBusy(false);
        return;
      }
      // Full navigation so the server layout re-renders with the new cookie.
      window.location.href = next;
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0d0d0d] flex flex-col">
      <div className="px-6 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-[#0d0d0d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to site
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <img
              src="/assets/images/Mkurugenzi-Merch/black-1-of-1-150x150.png"
              alt="Mkurugenzi"
              className="h-12 w-12 object-contain mb-4"
            />
            <h1 className="section-heading text-3xl sm:text-4xl">Mkurugenzi Admin</h1>
            <p className="text-sm text-black/45 mt-1.5">Sign in to manage your store.</p>
          </div>

          <form onSubmit={submit} className="bg-white border border-black/5 rounded-2xl p-6 lg:p-7 space-y-5">
            <Field label="Email">
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-black/25" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mkurugenzi.co.ke"
                  autoComplete="username"
                  required
                  className="pl-11"
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-black/25" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pl-11"
                />
              </div>
            </Field>

            {error && (
              <p className="text-sm rounded-xl bg-[#f0f0f1] px-4 py-3 text-black/70">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0d0d0d] text-white text-sm font-medium px-5 py-3 hover:bg-black transition-colors disabled:opacity-50"
            >
              {busy ? 'Signing in…' : 'Sign in'}
              {!busy && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-xs text-black/35 mt-6">
            Access is restricted to store staff.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <LoginForm />
    </Suspense>
  );
}
