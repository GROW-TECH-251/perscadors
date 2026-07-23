'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { fetchShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import { fetchActiveAssetsBySection } from '@/services/mediaService';
import { Link as LinkIcon } from 'lucide-react';
import type { ShopSettings, SiteAsset } from '@/admin/types';

export const Testimonials: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [testimonialAssets, setTestimonialAssets] = useState<SiteAsset[]>([]);
  const [tiktokAssets, setTiktokAssets] = useState<SiteAsset[]>([]);

  useEffect(() => {
    async function loadTestimonials() {
      const [data, testimData, tiktokData] = await Promise.all([
        fetchShopSettings(),
        fetchActiveAssetsBySection('testimonials'),
        fetchActiveAssetsBySection('tiktok')
      ]);
      if (data) setSettings(data);
      if (testimData && testimData.length > 0) setTestimonialAssets(testimData);
      if (tiktokData && tiktokData.length > 0) setTiktokAssets(tiktokData);
    }
    loadTestimonials();
  }, []);

  useShopSettingsRealtime(() => { window.location.reload(); });
  useSiteAssetsRealtime(() => { window.location.reload(); });

  const data = settings.testimonials_json;

  // Utiliser les assets dynamiques de l'admin s'ils existent, sinon les vidéos par défaut
  const displayVideos = testimonialAssets.length > 0
    ? testimonialAssets.map((a) => ({ src: a.url, title: a.title, description: a.description || 'Client satisfait HP Collection.' }))
    : data.videos;

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          
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
                />
              </div>
            </div>

            <div className="p-4 bg-brand-bg-alt rounded-lg border-l-4 border-brand-gold text-xs leading-relaxed text-brand-text-muted italic">
              &quot;{data.screenshot_quote}&quot;
            </div>
          </div>

          {/* Videos column (Right, 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {displayVideos.map((vid, index) => (
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
                    className="w-full h-full object-contain bg-black"
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

        {/* Section TikTok / Embeds Sociaux Dynamiques */}
        {tiktokAssets.length > 0 && (
          <div className="space-y-6 pt-12 border-t border-brand-gold/10">
            <div className="text-center">
              <h3 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
                TikToks Viraux de Vioutou 🔥
              </h3>
              <p className="text-sm text-brand-text-muted">Suivez les actualités et les drops en vidéo sur nos réseaux</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tiktokAssets.map((asset) => (
                <a
                  key={asset.id}
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col bg-brand-bg border border-brand-gold/15 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group cursor-pointer"
                >
                  <div className="relative w-full aspect-[16/9] bg-gradient-to-tr from-purple-900/40 via-black to-blue-900/40 flex flex-col items-center justify-center p-6 text-center space-y-3 group-hover:brightness-110 transition-all">
                    <LinkIcon size={36} className="text-brand-gold animate-bounce" />
                    <p className="font-bebas text-xl text-white uppercase tracking-wider truncate w-full">{asset.title}</p>
                    <span className="text-xs text-brand-gold font-mono bg-black/60 px-4 py-1.5 rounded-full border border-brand-gold/20 truncate w-full shadow">
                      Ouvrir sur TikTok ↗
                    </span>
                  </div>
                  <div className="p-5 bg-brand-bg-alt">
                    <p className="text-sm text-brand-text-muted leading-relaxed line-clamp-2">
                      {asset.description || asset.alt}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
