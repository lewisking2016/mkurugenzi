'use client';

import React, { useState } from 'react';
import { MessageCircle, MapPin, Send, Check, Instagram, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  const [values, setValues] = useState({ name: '', contact: '', subject: '', body: '', website: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Something went wrong');

      setValues({ name: '', contact: '', subject: '', body: '', website: '' });
      setState('sent');
      setTimeout(() => setState((s) => (s === 'sent' ? 'idle' : s)), 8000);
    } catch (e) {
      setState('idle');
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10">

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-5 mb-16 pt-16">
        <div className="pill-tag justify-center mb-2">
          <span className="pill-tag-icon">
            <img
              src="/assets/images/Mkurugenzi – Merch/black-1-of-1-150x150.png"
              alt="Mkurugenzi logo"
              className="w-5 h-5 object-contain brightness-0 invert"
            />
          </span>
          Customer concierge & orders
        </div>
        <h1 className="section-heading text-6xl sm:text-7xl">Get in touch</h1>
        <p className="text-[#4a4a50] text-base">
          Have a question about an order, size availability, or custom requests? We are here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Support Channels */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <a
              href="https://wa.me/254716265661"
              target="_blank"
              rel="noopener noreferrer"
              className="p-8 rounded-3xl bg-[#f0f0f1] hover:bg-[#e8e8ea] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-6 text-[#0d0d0d]">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#0d0d0d] mb-1">WhatsApp Order Desk</h3>
              <p className="text-sm text-black/50">Instant order processing & tracking</p>
              <span className="text-sm font-medium text-[#0d0d0d] mt-6 block group-hover:underline">
                Chat on WhatsApp <ArrowRight className="w-4 h-4 inline" />
              </span>
            </a>

            <a
              href="https://www.instagram.com/mkurugenzimerch"
              target="_blank"
              rel="noopener noreferrer"
              className="p-8 rounded-3xl bg-[#f0f0f1] hover:bg-[#e8e8ea] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-6 text-[#0d0d0d]">
                <Instagram className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#0d0d0d] mb-1">Instagram DM</h3>
              <p className="text-sm text-black/50">@mkurugenzimerch</p>
              <span className="text-sm font-medium text-[#0d0d0d] mt-6 block group-hover:underline">
                Send DM <ArrowRight className="w-4 h-4 inline" />
              </span>
            </a>
          </div>

          <div className="p-8 rounded-3xl bg-[#f0f0f1] flex items-start gap-5">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-[#0d0d0d]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0d0d0d]">Nairobi Showroom & Pickup</h3>
              <p className="text-sm text-black/50 mt-1 leading-relaxed">
                Nairobi, Kenya — Open Mon to Sat: 9:00 AM – 6:00 PM EAT
              </p>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="bg-[#f0f0f1] p-8 lg:p-10 rounded-3xl space-y-6">
          <div>
            <h2 className="section-heading text-4xl mb-2">Send a message</h2>
            <p className="text-sm text-black/50">
              Fill out your details and our concierge team will get back to you within 2 hours.
            </p>
          </div>

          {state === 'sent' ? (
            <div className="p-8 rounded-2xl bg-white text-center space-y-2">
              <Check className="w-8 h-8 mx-auto text-[#0d0d0d]" />
              <h3 className="font-semibold text-[#0d0d0d] text-lg">Message received!</h3>
              <p className="text-sm text-black/50">Thank you. Our team will contact you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Full Name', key: 'name', placeholder: 'e.g. John Doe', required: true },
                { label: 'Phone / WhatsApp or Email', key: 'contact', placeholder: 'e.g. +254 712 345 678', required: true },
                { label: 'Subject', key: 'subject', placeholder: 'Order status / Sizing / Custom inquiry', required: false },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium uppercase tracking-[0.1em] text-black/50 block mb-2">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={values[field.key as 'name' | 'contact' | 'subject']}
                    onChange={update(field.key as 'name' | 'contact' | 'subject')}
                    required={field.required}
                    placeholder={field.placeholder}
                    className="w-full px-5 py-3.5 rounded-full bg-white border border-black/10 text-sm focus:outline-none focus:border-black/40"
                  />
                </div>
              ))}

              {/* Honeypot — hidden from people, irresistible to bots. */}
              <div aria-hidden="true" className="hidden">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.website}
                  onChange={update('website')}
                />
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-[0.1em] text-black/50 block mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={values.body}
                  onChange={update('body')}
                  placeholder="How can we assist you today?"
                  className="w-full px-5 py-4 rounded-2xl bg-white border border-black/10 text-sm focus:outline-none focus:border-black/40 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-[#0d0d0d] bg-white rounded-2xl px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={state === 'sending'}
                className="w-full py-4 bg-[#0d0d0d] hover:bg-[#2a2a2a] disabled:opacity-60 text-white font-medium text-sm rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {state === 'sending' ? 'Sending…' : 'Submit message'}
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
