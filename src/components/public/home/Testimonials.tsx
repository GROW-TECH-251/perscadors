'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { fetchPublicShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import { fetchActiveAssetsBySection } from '@/services/mediaService';
import type { ShopSettings, SiteAsset } from '@/admin/types';

export const Testimonials: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [testimonialAssets, setTestimonialAssets] = useState<SiteAsset[]>([]);

  useEffect(() => {
    async function loadTestimonials() {
      const [data, testimData] = await Promise.all([
        fetchPublicShopSettings(),
        fetchActiveAssetsBySection('testimonials')
      ]);
      if (data) setSettings(data);
      if (testimData && testimData.length > 0) setTestimonialAssets(testimData);
    }
    loadTestimonials();
  }, []);

  useShopSettingsRealtime(() => { window.location.reload(); });
  useSiteAssetsRealtime(() => { window.location.reload(); });

  const data = settings.testimonials_json;

  // Utiliser les assets dynamiques s'ils existent, mais pour l'instant afficher des avis textuels factices
  const fakeTestimonials = [
    { name: 'Aïcha', quote: "J'ai commandé une tenue complète, la qualité est incroyable. Livraison rapide !", city: 'Cotonou' },
    { name: 'Kossi', quote: "Style unique et service au top — je recommande HP Collection.", city: 'Abomey-Calavi' },
    { name: 'Marie', quote: "Les couleurs rendent encore mieux en vrai. Très satisfaite.", city: 'Porto-Novo' },
  ];

  return (
    <section id="testimonials" className="py-24 bg-brand-bg-alt border-y border-brand-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="font-bebas text-4xl sm:text-6xl tracking-wider text-brand-gold mb-4 uppercase">
            Ils nous font confiance
          </h2>
          <div className="w-20 h-1 bg-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted max-w-xl mx-auto text-base sm:text-lg">
            Découvre les retours en direct de nos kings et reines qui s&apos;habillent chez {settings.shop_name}.
          </p>
        </div>

        {/* Grid d'avis textuels factices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {fakeTestimonials.map((t, i) => (
            <div key={i} className="p-6 bg-brand-bg border border-brand-gold/10 rounded-2xl shadow-lg">
              <div className="text-sm text-brand-text-muted mb-4">{t.city}</div>
              <h4 className="font-bebas text-lg text-brand-gold mb-2">{t.name}</h4>
              <p className="text-sm text-brand-text leading-relaxed">"{t.quote}"</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
