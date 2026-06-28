'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { fetchShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import type { ShopSettings } from '@/admin/types';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());

  useEffect(() => {
    async function loadFAQ() {
      const data = await fetchShopSettings();
      if (data && data.faq_json) {
        setSettings(data);
      }
    }
    loadFAQ();
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqList = settings.faq_json || getDefaultShopSettings().faq_json;

  return (
    <section id="faq" className="py-24 bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="font-bebas text-4xl sm:text-6xl tracking-wider text-brand-gold mb-4 uppercase">
            Vous avez des questions ?
          </h2>
          <div className="w-20 h-1 bg-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted max-w-xl mx-auto text-base sm:text-lg">
            Tout ce qu&apos;il faut savoir pour deal avec Vioutou en toute sérénité.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqList.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-brand-gold/15 rounded-xl bg-brand-bg-alt overflow-hidden transition-all duration-300 shadow-sm hover:border-brand-gold/40"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer transition-colors"
                >
                  <span className="font-bebas text-xl sm:text-2xl text-brand-text tracking-wide uppercase">
                    {item.question}
                  </span>
                  <div className="p-1 bg-brand-gold/10 text-brand-gold rounded-full flex-shrink-0">
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </button>

                {/* Animated collapse content */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-48 border-t border-brand-gold/10' : 'max-h-0'
                  }`}
                >
                  <p className="p-6 text-sm sm:text-base text-brand-text-muted leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
