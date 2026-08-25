'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchPublicShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import { fetchActiveAssetBySection } from '@/services/mediaService';
import type { ShopSettings } from '@/admin/types';

const DEFAULT_HERO_VIDEO = '/assets/backgrounds/7679830-uhd_4096_2160_25fps.mp4';

type HeroMediaType = 'video' | 'image';

export const Hero: React.FC = () => {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<HeroMediaType>('video');
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [realtimeVersion, setRealtimeVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadHero() {
      const [settingsData, assetData] = await Promise.all([
        fetchPublicShopSettings(),
        fetchActiveAssetBySection('hero'),
      ]);

      if (!isMounted) return;

      if (settingsData) {
        setSettings(settingsData);
      }

      if (assetData) {
        setMediaUrl(assetData.url);
        setMediaType(assetData.type === 'image' ? 'image' : 'video');
        return;
      }

      if (settingsData?.hero_video_url) {
        setMediaUrl(settingsData.hero_video_url);
        setMediaType('video');
        return;
      }

      setMediaUrl(DEFAULT_HERO_VIDEO);
      setMediaType('video');
    }

    loadHero();
    return () => {
      isMounted = false;
    };
  }, [realtimeVersion]);

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
    <section className="relative w-full h-[calc(100vh-80px)] h-[calc(100svh-80px)] min-h-[560px] sm:min-h-[700px] flex items-center justify-center overflow-hidden bg-black text-[#EDEAE3]">
      {mediaUrl && mediaType === 'video' ? (
        <>
          <video
            aria-hidden="true"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-xl"
          >
            <source src={mediaUrl} type="video/mp4" />
          </video>
          <video
            onError={() => setMediaUrl('')}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain opacity-90"
          >
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
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
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-black/30 to-black/35 z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.25)_20%,transparent_65%)] z-10" />

      <div className="relative z-20 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col items-center justify-center">
        <div className="space-y-4 animate-slide-up-fade">
          <h1 className="font-bebas text-5xl sm:text-7xl lg:text-8xl tracking-wider text-white uppercase drop-shadow-2xl leading-none">
            {heroTitleParts.primary}.
            {heroTitleParts.secondary ? (
              <span className="text-brand-gold"> {heroTitleParts.secondary}.</span>
            ) : null}
          </h1>
          <p className="hidden sm:block text-brand-text-muted max-w-2xl mx-auto text-base sm:text-xl font-light leading-relaxed">
            {settings.hero_subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-4 animate-slide-up-fade">
          <Link
            href="#carousel-outfits"
            className="group w-full sm:w-auto px-9 py-4.5 bg-brand-gold hover:bg-brand-gold-light active:bg-[#9F7F1F] text-[#0A0A0A] font-bebas text-xl tracking-[3px] uppercase transition-all duration-400 ease-[cubic-bezier(0.23,1.0,0.32,1)] hover:scale-[1.03] active:scale-[0.985] rounded-xl shadow-2xl hover:shadow-[0_20px_35px_-10px_rgb(0,0,0,0.5)] ring-1 ring-inset ring-black/10 text-center flex items-center justify-center gap-2.5"
          >
            <span>Voir les outfits</span>
          </Link>
          <Link
            href="#categories"
            className="group w-full sm:w-auto px-9 py-4.5 bg-transparent border-2 border-white hover:border-brand-gold hover:text-brand-gold active:bg-white/5 text-white font-bebas text-xl tracking-[3px] uppercase transition-all duration-400 ease-[cubic-bezier(0.23,1.0,0.32,1)] hover:scale-[1.03] active:scale-[0.985] rounded-xl text-center flex items-center justify-center gap-2.5"
          >
            <span>Voir la collection</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
