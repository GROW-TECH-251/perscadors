'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchPublicShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import { fetchActiveAssetBySection } from '@/services/mediaService';
import { ChevronDown } from 'lucide-react';
import type { ShopSettings } from '@/admin/types';

const LEGACY_HERO_VIDEO_4K = '/assets/backgrounds/7679830-uhd_4096_2160_25fps.mp4';
// PERF-01 — Variantes allégées de la même vidéo (identité visuelle conservée) :
// 1080p = 6,5 Mo (desktop) / 720p = 2,8 Mo (mobile) contre 36 Mo en 4K.
// Faststart + sans piste audio (vidéo de fond muette).
const HERO_VIDEO_1080P = '/assets/backgrounds/hero-1080p.mp4';
const HERO_VIDEO_720P = '/assets/backgrounds/hero-720p.mp4';

// PERF-01 — Le hero ne doit JAMAIS attendre la base pour peindre : la
// variante par défaut est choisie au premier rendu (720p si mobile), le
// poster est rendu immédiatement, la vidéo démarre en parallèle des fetch.
function resolveDefaultHeroVideo(): string {
  if (typeof window === 'undefined') return HERO_VIDEO_1080P;
  return window.matchMedia('(max-width: 767px)').matches ? HERO_VIDEO_720P : HERO_VIDEO_1080P;
}

// Les réglages/admin peuvent encore référencer l'ancienne 4K : on la mappe
// vers la variante adaptée au lieu de re-télécharger 36 Mo.
function mapLegacyHeroVideo(url: string): string {
  return url === LEGACY_HERO_VIDEO_4K ? resolveDefaultHeroVideo() : url;
}
// IMP-04 — Poster par défaut du Hero : peint immédiatement (chargement),
// remplit le letterbox desktop en flou, et constitue le fallback net si la
// vidéo échoue. Aucun champ poster n'existe dans shop_settings ; asset local.
const DEFAULT_HERO_POSTER = '/assets/collections/articles/BASKET POUR HOMME/IMG-20251014-WA0036.jpg';

type HeroMediaType = 'video' | 'image';

export const Hero: React.FC = () => {
  const [mediaUrl, setMediaUrl] = useState<string>(resolveDefaultHeroVideo);
  const [mediaType, setMediaType] = useState<HeroMediaType>('video');
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [realtimeVersion, setRealtimeVersion] = useState(0);
  // IMP-04 — Fin de l'écran vide : si la vidéo échoue, l'image poster
  // (nette) prend le relais au lieu de laisser un fond noir.
  const [videoFailed, setVideoFailed] = useState(false);
  // PERF-01 — Fondu poster → vidéo : la vidéo n'apparaît qu'à canplay
  // (transition opacity sur token motion, neutralisée en reduced-motion).
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // OV-4 — La vidéo ne se charge QUE lorsque le hero est réellement
  // visible (IntersectionObserver) : l'intro sticky h-screen le recouvre
  // dans le flux, donc intersection = fausse pendant toute l'intro ->
  // ZÉRO octet vidéo tant que l'utilisateur n'a pas convergé. Fini aussi
  // le double téléchargement mobile (1080p du HTML serveur + 720p client) :
  // le HTML servi ne contient plus d'attribut src vidéo, la variante (matchMedia)
  // est posée au client au moment du montage — une seule est téléchargée.
  const sectionRef = useRef<HTMLElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    if (heroVisible) return;
    const node = sectionRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Anciens navigateurs sans IO : bascule asynchrone (même motif
      // que le rAF videoReady — jamais de setState synchrone en effet).
      const raf = requestAnimationFrame(() => setHeroVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          io.disconnect();
          setHeroVisible(true);
        }
      },
      // Marge de préchargement : la vidéo démarre juste AVANT l'entrée
      // à l'écran pour que le fondu poster->vidéo reste imperceptible.
      { rootMargin: '200px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [heroVisible]);

  useEffect(() => {
    let isMounted = true;

    async function loadHero() {
      const [settingsData, assetData] = await Promise.all([
        fetchPublicShopSettings(),
        fetchActiveAssetBySection('hero'),
      ]);

      if (!isMounted) return;

      setVideoFailed(false);

      if (settingsData) {
        setSettings(settingsData);
      }

      // PERF-01 — Ne remplacer le média par défaut QUE s'il est différent
      // (l'ancienne 4K est mappée vers la variante allégée) : aucun
      // re-téléchargement ni scintillement quand les données confirment les
      // défauts. L'état initial (poster + vidéo variante) est déjà affiché.
      if (assetData) {
        if (assetData.type === 'image') {
          setMediaType('image');
          setMediaUrl(assetData.url);
          return;
        }
        setMediaType('video');
        const nextUrl = mapLegacyHeroVideo(assetData.url);
        setMediaUrl((current) => (current === nextUrl ? current : nextUrl));
        return;
      }

      if (settingsData?.hero_video_url) {
        setMediaType('video');
        const nextUrl = mapLegacyHeroVideo(settingsData.hero_video_url);
        setMediaUrl((current) => (current === nextUrl ? current : nextUrl));
        return;
      }
    }

    loadHero();
    return () => {
      isMounted = false;
    };
  }, [realtimeVersion]);

  // PERF-01/OV-4 — Alignement impératif src + load() : le HTML servi ne
  // contient plus de src vidéo (poster seul), la balise vidéo monte au client à
  // l'apparition du hero avec sa variante matchMedia ; cet effet garde les
  // changements de média temps réel (admin) — React met l'attribut à jour
  // mais n'appelle pas load(), sans lequel l'ancien flux continuerait.
  useEffect(() => {
    const element = videoRef.current;
    if (!element || !mediaUrl) return;
    if (element.getAttribute('src') !== mediaUrl) {
      element.setAttribute('src', mediaUrl);
      element.load();
    }
    // PERF-01 — Si la vidéo est déjà prête avant l'hydratation, l'événement
    // canplay a été manqué par le handler React : déclencher le fondu via
    // rAF (asynchrone, pas de rendu en cascade).
    if (element.readyState >= 3) {
      requestAnimationFrame(() => setVideoReady(true));
    }
  }, [mediaUrl]);

  const heroTitleParts = useMemo(() => {
    const titleParts = settings.hero_title.split('.');
    const primary = titleParts[0]?.trim() || settings.hero_title;
    const secondary = titleParts.slice(1).join('.').trim();

    return { primary, secondary };
  }, [settings.hero_title]);

  useShopSettingsRealtime(() => {
    setRealtimeVersion((version) => version + 1);
  });

  useSiteAssetsRealtime(() => {
    setRealtimeVersion((version) => version + 1);
  });

  return (
    <section
      ref={sectionRef}
      className="perscadors-hero relative w-full flex items-center justify-center overflow-hidden bg-black text-[#EDEAE3]"
    >
      {mediaUrl && mediaType === 'video' && !videoFailed ? (
        <>
          {/* IMP-04 — Couche poster (une seule vidéo décodée, fin du double
              décodage UHD) : image optimisée peinte immédiatement (état de
              chargement + LCP), floutée pour combler le letterbox desktop
              (lg:object-contain). Elle reste masquée sous la vidéo sur mobile. */}
          <Image
            src={DEFAULT_HERO_POSTER}
            alt=""
            fill
            sizes="100vw"
            quality={40}
            priority
            aria-hidden="true"
            className="absolute inset-0 scale-125 object-cover opacity-70 blur-lg lg:blur-xl"
          />
          {heroVisible && (
          <video
            ref={videoRef}
            src={mediaUrl}
            poster={DEFAULT_HERO_POSTER}
            onError={() => setVideoFailed(true)}
            onCanPlay={() => setVideoReady(true)}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 h-full w-full object-cover lg:object-contain transition-opacity duration-(--motion-reveal) ease-out-luxe ${videoReady ? 'opacity-90' : 'opacity-0'}`}
          >
            Your browser does not support the video tag.
          </video>
          )}
        </>
      ) : mediaUrl && mediaType === 'image' ? (
        <Image
          src={mediaUrl}
          alt={settings.hero_title}
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover opacity-65"
          priority
        />
      ) : videoFailed ? (
        /* IMP-04 — Fallback net : la vidéo a échoué, le poster prend le
           relais (jamais d'écran vide). */
        <Image
          src={DEFAULT_HERO_POSTER}
          alt={settings.hero_title}
          fill
          sizes="100vw"
          quality={60}
          priority
          className="absolute inset-0 object-cover opacity-80"
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-black/30 to-black/35 z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.25)_20%,transparent_65%)] z-10" />

      <div className="relative z-20 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col items-center justify-center">
        <div className="space-y-4">
          <div className="animate-slide-up-fade stagger-1">
            <h1 className="font-bebas text-hero tracking-wider text-white uppercase drop-shadow-2xl leading-none">
              {heroTitleParts.primary}.
              {heroTitleParts.secondary ? (
                <span className="text-brand-gold"> {heroTitleParts.secondary}.</span>
              ) : null}
            </h1>
          </div>
          <div className="animate-slide-up-fade stagger-2">
            <p className="hidden sm:block text-brand-text-muted max-w-2xl mx-auto text-base sm:text-xl font-light leading-relaxed">
              {settings.hero_subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-4 animate-slide-up-fade stagger-3">
          <Link
            href="#carousel-outfits"
            className="group w-full sm:w-auto px-9 py-4.5 bg-brand-gold hover:bg-brand-gold-light active:bg-[#9F7F1F] text-[#0A0A0A] font-bebas text-xl tracking-[3px] uppercase transition-all duration-(--motion-smooth) ease-out-luxe hover:scale-[1.03] active:scale-[0.985] rounded-xl shadow-2xl hover:shadow-[0_20px_35px_-10px_rgb(0,0,0,0.5)] ring-1 ring-inset ring-black/10 text-center flex items-center justify-center gap-2.5"
          >
            <span>Voir les outfits</span>
          </Link>
          <Link
            href="#categories"
            className="group w-full sm:w-auto px-9 py-4.5 bg-transparent border-2 border-white hover:border-brand-gold hover:text-brand-gold active:bg-white/5 text-white font-bebas text-xl tracking-[3px] uppercase transition-all duration-(--motion-smooth) ease-out-luxe hover:scale-[1.03] active:scale-[0.985] rounded-xl text-center flex items-center justify-center gap-2.5"
          >
            <span>Voir la collection</span>
          </Link>
        </div>
      </div>

      {/* IMP-04 — Indicateur de scroll discret vers les outfits.
          Wrapper positionnant (left-1/2 -translate-x-1/2) + span animé en
          translateY seul : le centrage ne dépend pas de l'animation. */}
      <a
        href="#carousel-outfits"
        aria-label="Découvrir les outfits Vioutou"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 text-white/70 hover:text-brand-gold transition-colors cursor-pointer"
      >
        <span className="animate-scroll-cue block p-1">
          <ChevronDown size={26} aria-hidden="true" />
        </span>
      </a>
    </section>
  );
};

export default Hero;
