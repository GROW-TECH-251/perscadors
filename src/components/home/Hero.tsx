'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import { fetchActiveAssetBySection } from '@/services/mediaService';
const HERO_FALLBACK_IMAGE = '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0036.jpg';

import type { ShopSettings } from '@/admin/types';

export const Hero: React.FC = () => {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [videoReady, setVideoReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [realtimeVersion, setRealtimeVersion] = useState(0);

  useEffect(() => {
    async function loadHero() {
      const [settingsData, assetData] = await Promise.all([
        fetchShopSettings(),
        fetchActiveAssetBySection('hero')
      ]);

      if (settingsData) {
        setSettings(settingsData);
      }

      const timer = setTimeout(() => {
        if (assetData) {
          setMediaUrl(assetData.url);
          setMediaType(assetData.type);
        } else if (settingsData?.hero_video_url) {
          setMediaUrl(settingsData.hero_video_url);
          setMediaType('video');
        } else {
          setMediaUrl('/images/ARRIEREPLAN/7679830-uhd_4096_2160_25fps.mp4');
          setMediaType('video');
        }
      }, 600);

      return () => clearTimeout(timer);
    }
    loadHero();
  }, [realtimeVersion]);

  useShopSettingsRealtime(() => { setRealtimeVersion((version) => version + 1); });
  useSiteAssetsRealtime(() => { setRealtimeVersion((version) => version + 1); });

  useEffect(() => {
    if (!mediaUrl) return;

    const ric = (callback: IdleRequestCallback) => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 150);
      }
    };

    const idleHandle = ric(() => {
      setMounted(true);
    });

    return () => {
      if ('cancelIdleCallback' in window && typeof idleHandle === 'number') {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [mediaUrl]);

  const handleVideoCanPlay = useCallback(() => {
    setVideoReady(true);
  }, []);

  const showVideo = mounted && mediaUrl && mediaType === 'video';
  const showImage = mediaUrl && mediaType === 'image';

  return (
    <section
      className="relative w-full h-[calc(100vh-80px)] min-h-[700px] flex items-center justify-center overflow-hidden bg-black text-[#EDEAE3]"
    >
      {/* Placeholder always visible — dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1510] to-[#0a0a0a]" />

      {/* Video — mounted lazily after page is interactive */}
      {showVideo && (
        <video
          ref={videoRef}
          onError={() => { setMediaUrl(HERO_FALLBACK_IMAGE); setMediaType('image'); }}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onCanPlay={handleVideoCanPlay}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoReady ? 'opacity-65' : 'opacity-0'
          }`}
        >
          <source src={mediaUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Image fallback */}
      {showImage && (
        <Image
          src={mediaUrl}
          alt={settings.hero_title}
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover opacity-65"
          priority
        />
      )}

      {/* Luxury Golden Overlay - Enhanced premium depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/42 to-black/65 z-10" />

      {/* Subtle vignette for premium feel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.25)_20%,transparent_65%)] z-10" />

      {/* Content wrapper - Centered */}
      <div className="relative z-20 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col items-center justify-center">
        
        {/* Premium Typography Hierarchy - Level 2 Immersive Hero */}
        <div className="space-y-4 animate-slide-up-fade">
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold border border-brand-gold/20 backdrop-blur-md shadow-lg">
            Collection Premium • {settings.country || 'Bénin'}
          </span>
          <h1 className="font-bebas text-5xl sm:text-7xl lg:text-8xl tracking-wider text-white uppercase drop-shadow-2xl leading-none">
            {settings.hero_title.split('.')[0]}. <span className="text-brand-gold">{settings.hero_title.split('.')[1] ? settings.hero_title.split('.')[1].trim() + '.' : ''}</span>
          </h1>
          <p className="text-brand-text-muted max-w-2xl mx-auto text-base sm:text-xl font-light leading-relaxed">
            {settings.hero_subtitle}
          </p>
        </div>

        {/* Action CTAs Centered - Enhanced premium interactions */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up-fade"
        >
          <Link
            href="#carousel-outfits"
            className="group w-full sm:w-auto px-9 py-4.5 bg-brand-gold hover:bg-brand-gold-light active:bg-[#9F7F1F] text-[#0A0A0A] font-bebas text-xl tracking-[3px] uppercase transition-all duration-400 ease-[cubic-bezier(0.23,1.0,0.32,1)] hover:scale-[1.03] active:scale-[0.985] rounded-xl shadow-2xl hover:shadow-[0_20px_35px_-10px_rgb(0,0,0,0.5)] ring-1 ring-inset ring-black/10 text-center flex items-center justify-center gap-2.5"
          >
            <span>Voir les outfits</span>
            <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="#categories"
            className="group w-full sm:w-auto px-9 py-4.5 bg-transparent border-2 border-white hover:border-brand-gold hover:text-brand-gold active:bg-white/5 text-white font-bebas text-xl tracking-[3px] uppercase transition-all duration-400 ease-[cubic-bezier(0.23,1.0,0.32,1)] hover:scale-[1.03] active:scale-[0.985] rounded-xl text-center flex items-center justify-center gap-2.5"
          >
            <span>Voir la collection</span>
            <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>

      {/* Scroll indicator - Enhanced premium micro-interaction */}
      <div 
        onClick={() => document.getElementById('carousel-outfits')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer group"
      >
        <span className="font-bebas text-sm tracking-[3.5px] uppercase text-brand-gold group-hover:text-brand-gold-light transition-colors duration-300">
          Défiler
        </span>
        <div className="w-1 h-9 bg-gradient-to-b from-brand-gold to-transparent rounded-full group-hover:h-10 transition-all duration-400 ease-out group-hover:scale-y-110" />
      </div>
    </section>
  );
};
