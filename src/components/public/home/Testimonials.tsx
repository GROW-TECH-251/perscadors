'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Quote } from 'lucide-react';
import { fetchPublicShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import type { ShopSettings, TestimonialsData } from '@/admin/types';

// Fallback de dernier recours : uniquement si aucune capture ET aucune vidéo
// n'est configurée. Le schéma réellement stocké est un objet TestimonialsData
// { screenshot_url, screenshot_quote, videos[] } (voir admin/types.ts), pas un
// tableau de citations — l'ancien code attendait un tableau, ce qui provoquait
// un fallback systématique et rendait le travail admin invisible en vitrine.
const FALLBACK_TESTIMONIALS = [
  { name: 'Aïcha', quote: "J'ai commandé une tenue complète, la qualité est incroyable. Livraison rapide !", city: 'Cotonou' },
  { name: 'Kossi', quote: "Style unique et service au top — je recommande HP Collection.", city: 'Abomey-Calavi' },
  { name: 'Marie', quote: "Les couleurs rendent encore mieux en vrai. Très satisfaite.", city: 'Porto-Novo' },
];

function pickVideos(data: TestimonialsData) {
  return (data.videos ?? []).filter(
    (v) => v && typeof v.src === 'string' && v.src.length > 0
  );
}

export const Testimonials: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [testimonials, setTestimonials] = useState<TestimonialsData>(
    getDefaultShopSettings().testimonials_json
  );

  const loadTestimonials = useCallback(async () => {
    try {
      const data = await fetchPublicShopSettings();
      if (data) {
        setSettings(data);
        // data.testimonials_json est déjà normalisé côté service (objet
        // TestimonialsData) : on le consomme tel quel.
        setTestimonials(data.testimonials_json);
      }
    } catch {
      // Garde le contenu précédent (défauts) en cas d'erreur réseau.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load intentional
    void loadTestimonials();
  }, [loadTestimonials]);

  // Rechargement ciblé (sans reload complet) quand les réglages ou les médias changent.
  useShopSettingsRealtime(() => {
    void loadTestimonials();
  });
  useSiteAssetsRealtime(() => {
    void loadTestimonials();
  });

  // PERF-03 — Les vidéos témoignages (3,9 Mo au total) sont BELOW-FOLD :
  // on ne monte les <video> qu'à l'approche du viewport (IntersectionObserver,
  // marge 300 px). Avant : rendues au chargement initial, elles se
  // téléchargeaient pendant que l'utilisateur regarde encore le hero.
  // Dégradation : sans IntersectionObserver (très anciens navigateurs),
  // montage immédiat — comportement historique.
  const videosSectionRef = useRef<HTMLDivElement | null>(null);
  const [videosVisible, setVideosVisible] = useState(false);

  useEffect(() => {
    const node = videosSectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVideosVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVideosVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const screenshotUrl = testimonials.screenshot_url;
  const videos = pickVideos(testimonials);
  const hasScreenshot = Boolean(screenshotUrl);
  const hasVideos = videos.length > 0;

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

        {/* Capture WhatsApp de référence + citation (schéma stocké) */}
        {hasScreenshot && (
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-brand-bg border border-brand-gold/10 rounded-3xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-72 md:h-auto md:min-h-[320px] bg-white/5">
                  <Image
                    src={screenshotUrl}
                    alt="Capture WhatsApp d'un client satisfait"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-4"
                    unoptimized
                  />
                </div>
                <div className="p-6 sm:p-8 flex flex-col justify-center gap-4">
                  <Quote size={28} className="text-brand-gold" />
                  <p className="text-brand-text leading-relaxed text-sm sm:text-base">
                    {testimonials.screenshot_quote}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vidéos de validation clients (schéma stocké) */}
        {hasVideos && (
          <div ref={videosSectionRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {videos.map((video, index) => (
              <div
                key={video.src || index}
                className="bg-brand-bg border border-brand-gold/10 rounded-2xl shadow-lg overflow-hidden"
              >
                {videosVisible ? (
                  <video
                    src={video.src}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full aspect-video object-contain bg-black"
                  />
                ) : (
                  <div className="w-full aspect-video bg-brand-bg-alt skeleton-media" aria-busy="true" />
                )}
                <div className="p-5">
                  <h4 className="font-bebas text-lg text-brand-gold mb-1">{video.title}</h4>
                  {video.description && (
                    <p className="text-sm text-brand-text-muted leading-relaxed">{video.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aucune donnée configurée : citations de repli */}
        {!hasScreenshot && !hasVideos && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {FALLBACK_TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 bg-brand-bg border border-brand-gold/10 rounded-2xl shadow-lg">
                <div className="text-sm text-brand-text-muted mb-4">{t.city}</div>
                <h4 className="font-bebas text-lg text-brand-gold mb-2">{t.name}</h4>
                <p className="text-sm text-brand-text leading-relaxed">&quot;{t.quote}&quot;</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
