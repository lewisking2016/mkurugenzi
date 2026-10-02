'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDown, CreditCard, Truck, Package, FileText, MessageCircle } from 'lucide-react';

const FAQ_SECTIONS = [
  {
    icon: CreditCard,
    title: 'Payment information',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept M-Pesa, PayPal, Visa, Mastercard and American Express, plus pay-on-delivery (cash or M-Pesa at the door). Pick your preferred platform at checkout and step-by-step payment directions are shown right there.',
      },
      {
        q: 'Is it safe to pay via M-Pesa?',
        a: 'Yes. We only send payment details from our official number +254 716 265 661. Always confirm the recipient name before completing any M-Pesa transaction.',
      },
      {
        q: 'Do I receive an invoice for my order?',
        a: 'Yes. Every order placed through WhatsApp receives a confirmation message with the item list, prices and totals, which acts as your receipt.',
      },
    ],
  },
  {
    icon: Truck,
    title: 'Shipping & delivery',
    items: [
      {
        q: 'What are the delivery charges?',
        a: 'Delivery is free within Nairobi on orders above KES 3,000. Below that, a flat KES 300 courier fee applies. Countrywide deliveries are charged based on county rates.',
      },
      {
        q: 'How long will delivery take?',
        a: 'Nairobi orders: same-day or next-day delivery. Countrywide: 1–3 working days via courier. You will receive tracking updates on WhatsApp.',
      },
      {
        q: 'Do you deliver outside Nairobi?',
        a: 'Yes — we deliver countrywide across all 47 counties via trusted courier partners.',
      },
    ],
  },
  {
    icon: Package,
    title: 'Orders & returns',
    items: [
      {
        q: 'What exactly happens after ordering?',
        a: 'Once you place your order, our team confirms availability, sizes and your delivery address via WhatsApp. After payment, your order is packed and dispatched with tracking shared on WhatsApp.',
      },
      {
        q: 'Can I exchange a size?',
        a: 'Yes. Unworn items with tags intact can be exchanged within 7 days of delivery. Reach out on WhatsApp to arrange a swap.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'Orders can be cancelled any time before dispatch. Once dispatched, we can arrange a return-and-refund per our exchange policy.',
      },
    ],
  },
  {
    icon: MessageCircle,
    title: 'Products & sizing',
    items: [
      {
        q: 'How do I choose the right size?',
        a: 'Each product page lists available sizes. Our sweatsuits run true to size with a boxy drop-shoulder fit — if you are between sizes, take the larger for a relaxed look.',
      },
      {
        q: 'Are the materials heavyweight?',
        a: 'Yes. Our signature fleece is custom 450GSM cotton — pre-shrunk, anti-fade and built to hold structure wash after wash.',
      },
    ],
  },
];

export default function FaqsPage() {
  const [open, setOpen] = useState<string | null>('0-0');

  return (
    <div className="pt-16 pb-24 max-w-[1400px] mx-auto px-6 lg:px-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-5 pt-16 pb-16">
        <div className="pill-tag justify-center mb-2">
          <span className="pill-tag-icon">
            <img
              src="/assets/images/Mkurugenzi-Merch/black-1-of-1-150x150.png"
              alt="Mkurugenzi logo"
              className="w-5 h-5 object-contain brightness-0 invert"
            />
          </span>
          Help center
        </div>
        <h1 className="section-heading text-6xl sm:text-7xl">FAQs</h1>
        <p className="text-black/50">Everything you need to know about ordering, delivery and our craft.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-12">
        {FAQ_SECTIONS.map((section, si) => (
          <motion.section
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-11 h-11 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center shrink-0">
                <section.icon className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-semibold text-[#0d0d0d]">{section.title}</h2>
            </div>

            <div className="space-y-3">
              {section.items.map((item, ii) => {
                const key = `${si}-${ii}`;
                const isOpen = open === key;
                return (
                  <div key={key} className="bg-[#f0f0f1] rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpen(isOpen ? null : key)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="font-medium text-[#0d0d0d] text-[15px]">{item.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-black/40 transition-transform duration-300 shrink-0 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: isOpen ? 'auto' : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm text-[#4a4a50] leading-relaxed">{item.a}</p>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        ))}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-[#0d0d0d] text-white p-10 lg:p-14 text-center"
        >
          <h2 className="section-heading text-white text-3xl sm:text-5xl mb-3">Still have questions?</h2>
          <p className="text-white/60 max-w-md mx-auto mb-8 text-sm">
            Our concierge team replies within minutes on WhatsApp — orders, sizing, anything.
          </p>
          <a
            href="https://wa.me/254716265661"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#0d0d0d] rounded-full px-8 py-4 text-sm font-medium hover:bg-[#0d0d0d] hover:text-white hover:ring-1 hover:ring-white/40 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with us
          </a>
        </motion.div>
      </div>
    </div>
  );
}
