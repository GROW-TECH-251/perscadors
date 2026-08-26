'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useEffect, useState, useCallback } from 'react';
import { fetchPublicShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import type { ShopSettings } from '@/admin/types';

type TestimonialItem = {
  name: string;
  quote: string;
  city: string;
};

const FALLBACK_TESTIMONIALS: TestimonialItem[] = [
  { name: 'Aïcha', quote: "J'ai commandé une tenue complète, la qualité est incroyable. Livraison rapide !", city: 'Cotonou' },
  { name: 'Kossi', quote: "Style unique et service au top — je recommande HP Collection.", city: 'Abomey-Calavi' },
  { name: 'Marie', quote: "Les couleurs rendent encore mieux en vrai. Très satisfaite.", city: 'Porto-Novo' },
];

export const Testimonials: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(FALLBACK_TESTIMONIALS);

  const loadTestimonials = useCallback(async () => {
    try {
      const data = await fetchPublicShopSettings();
      if (data) {
        setSettings(data);
        // Utilise les vraies données si présentes et valides, sinon fallback
        const realData = data.testimonials_json as unknown;
        if (Array.isArray(realData) && realData.length > 0) {
          const normalized = (realData as TestimonialItem[]).filter(
            (t) => t && typeof t.name === 'string' && typeof t.quote === 'string'
          );
          if (normalized.length > 0) {
            setTestimonials(normalized);
            return;
          }
        }
        // Si pas de vraies données, garde fallback
        setTestimonials(FALLBACK_TESTIMONIALS);
      }
    } catch {
      // Garde fallback en cas d'erreur
      setTestimonials(FALLBACK_TESTIMONIALS);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load intentional
    void loadTestimonials();
  }, [loadTestimonials]);

  // FIX PUB-PERF-01 + PUB-UX : Remplace window.location.reload() par re-fetch ciblé
  // Avant : reload complet page → latence 2-3s, perte état panier, UX cassée
  // Après : recharge seulement les témoignages via loadTestimonials → pas de reload
  useShopSettingsRealtime(() => {
    void loadTestimonials();
  });
  useSiteAssetsRealtime(() => {
    void loadTestimonials();
  });

  return (
    <section id="testimonials" className="py-24 bg-brand-bg-alt border-y border-brand-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-bebas text-4xl sm:text-6xl tracking-wider text-brand-gold mb-4 uppercase">
            Ils nous font confiance
          </h2>
          <div className="w-20 h-1 bg-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted max-w-xl mx-auto text-base sm:text-lg">
            Découvre les retours en direct de nos kings et reines qui s&apos;habillent chez {settings.shop_name}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {testimonials.map((t, i) => (
            <div key={i} className="p-6 bg-brand-bg border border-brand-gold/10 rounded-2xl shadow-lg">
              <div className="text-sm text-brand-text-muted mb-4">{t.city}</div>
              <h4 className="font-bebas text-lg text-brand-gold mb-2">{t.name}</h4>
              <p className="text-sm text-brand-text leading-relaxed">&quot;{t.quote}&quot;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
