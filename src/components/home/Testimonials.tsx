'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { fetchShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import type { ShopSettings } from '@/admin/types';

export const Testimonials: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());

  useEffect(() => {
    async function loadTestimonials() {
      const data = await fetchShopSettings();
      if (data) setSettings(data);
    }
    loadTestimonials();
  }, []);

  const data = settings.testimonials_json;

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

        {/* Asymmetrical Mix Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Screenshot columns (Left, 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 bg-brand-bg border border-brand-gold/15 rounded-2xl shadow-xl space-y-6">
            <div>
              <span className="font-bebas text-brand-gold tracking-widest text-sm uppercase block mb-2">
                En direct de WhatsApp 💬
              </span>
              <h3 className="font-bebas text-3xl tracking-wide text-brand-text uppercase leading-none">
                La référence au {settings.country}
              </h3>
              <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">
                Nos clients partagent leur satisfaction sur les réseaux sociaux. Voici l&apos;avis partagé sur WhatsApp par Poyor Poyor.
              </p>
            </div>

            {/* Polaroid / Mockup Frame for Screenshot */}
            <div className="relative w-full h-[180px] sm:h-[220px] rounded-lg overflow-hidden border-2 border-brand-gold/10 shadow-lg bg-white flex items-center justify-center p-2">
              <div className="relative w-full h-full">
                <Image
                  src={data.screenshot_url || '/images/Temoignages/photos/témoignageclient.jpeg'}
                  alt="Témoignage Poyor Poyor"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            <div className="p-4 bg-brand-bg-alt rounded-lg border-l-4 border-brand-gold text-xs leading-relaxed text-brand-text-muted italic">
              &quot;{data.screenshot_quote}&quot;
            </div>
          </div>

          {/* Videos column (Right, 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {data.videos.map((vid, index) => (
              <div
                key={index}
                className="flex flex-col bg-brand-bg border border-brand-gold/10 rounded-2xl overflow-hidden shadow-xl"
              >
                {/* Video container */}
                <div className="relative w-full aspect-[9/16] bg-black">
                  <video
                    src={vid.src}
                    controls
                    preload="metadata"
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Text explanation */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-bebas text-lg tracking-wide text-brand-gold mb-1">
                      {vid.title}
                    </h4>
                    <p className="text-xs text-brand-text-muted leading-relaxed">
                      {vid.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
