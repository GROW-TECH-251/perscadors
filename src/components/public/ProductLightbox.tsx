'use client';

// IMP-07 — Lightbox produit : zoom, navigation (clavier/boutons/swipe),
// miniatures et compteur. Aucune dépendance (React state + CSS transforms),
// conformément à la roadmap Phase 2. Accessible : role dialog + aria-modal,
// Escape/flèches, focus initial sur la fermeture, scroll body verrouillé
// (restauré au démontage). Swipe (seuil 45px) distingué du tap-zoom.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {Play,  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

const SWIPE_THRESHOLD = 45;
const ZOOM_SCALE = 2.2;

interface ProductLightboxProps {
  images: string[];
  startIndex: number;
  productName: string;
  onClose: () => void;
  video?: string;
}

export function ProductLightbox({ images, startIndex, productName, onClose, video }: ProductLightboxProps) {
  const total = images.length + (video ? 1 : 0);
  const videoSlideIndex = video ? images.length : -1;
  const [autoPlayVideo] = useState(
    () => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), Math.max(total - 1, 0)));
  const isVideoSlide = Boolean(video) && index === videoSlideIndex;
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const drag = useRef({ startX: 0, active: false });
  const swiped = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const go = useCallback((delta: number) => {
    setZoom(false);
    setIndex((current) => (total ? (current + delta + total) % total : 0));
  }, [total]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [go, onClose]);

  const handlePointerDown = (event: React.PointerEvent) => {
    drag.current = { startX: event.clientX, active: true };
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (!drag.current.active) return;
    const delta = event.clientX - drag.current.startX;
    drag.current.active = false;
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      swiped.current = true;
      go(delta < 0 ? 1 : -1);
    }
  };

  const handleToggleZoom = (event: React.MouseEvent) => {
    // Un swipe qui vient de finir ne doit pas déclencher un zoom accidentel.
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    // IMP-08 — Pas de zoom sur la slide vidéo (lecture gérée par <video>).
    if (isVideoSlide) return;
    if (zoom) {
      setZoom(false);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${Math.min(Math.max(x, 0), 100)}% ${Math.min(Math.max(y, 0), 100)}%`);
    setZoom(true);
  };

  return (
    <div
      className="lightbox-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Galerie de ${productName}`}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Fermer la galerie"
        className="absolute top-4 right-4 z-20 p-2.5 bg-[#0A0A0A]/70 hover:bg-brand-gold hover:text-brand-bg text-white rounded-full transition-colors cursor-pointer"
      >
        <X size={22} />
      </button>

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 font-bebas tracking-[3px] text-white/80 text-lg">
        {index + 1} / {total}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Image précédente"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-[#0A0A0A]/60 hover:bg-brand-gold hover:text-brand-bg text-white rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Image suivante"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-[#0A0A0A]/60 hover:bg-brand-gold hover:text-brand-bg text-white rounded-full transition-colors cursor-pointer"
          >
            <ChevronRight size={26} />
          </button>
        </>
      )}

      <div
        className="relative w-full max-w-4xl aspect-[3/4] sm:aspect-square overflow-hidden rounded-2xl select-none touch-pan-y cursor-zoom-in"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onClick={handleToggleZoom}
      >
        {isVideoSlide && video ? (
          <video
            key={video}
            src={video}
            className="h-full w-full rounded-2xl bg-black object-contain"
            controls
            autoPlay={autoPlayVideo}
            muted
            playsInline
            preload="metadata"
            aria-label={`Vidéo — ${productName}`}
          />
        ) : (
        <div
          className="lightbox-zoom absolute inset-0"
          style={{
            transform: zoom ? `scale(${ZOOM_SCALE})` : 'scale(1)',
            transformOrigin: origin,
          }}
        >
          <Image
            src={images[index]}
            alt={`${productName} — angle ${index + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 896px"
            quality={85}
            className="object-contain"
            draggable={false}
          />
        </div>
        )}
        {!isVideoSlide && (
          <div className="absolute bottom-3 right-3 z-10 p-2 bg-[#0A0A0A]/60 text-white/80 rounded-full pointer-events-none">
            {zoom ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
          </div>
        )}
      </div>

      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2.5 overflow-x-auto max-w-[90vw] px-2 py-1 scrollbar-none">
          {images.map((image, imageIndex) => (
            <button
              key={image}
              type="button"
              onClick={() => { setZoom(false); setIndex(imageIndex); }}
              aria-label={`Voir l'angle ${imageIndex + 1}`}
              aria-current={imageIndex === index}
              className={`relative w-12 sm:w-14 aspect-[3/4] flex-shrink-0 overflow-hidden rounded-lg border-2 cursor-pointer transition-all duration-(--motion-fast) ${
                imageIndex === index
                  ? 'border-brand-gold opacity-100'
                  : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
              }`}
            >
              <Image src={image} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
          {video && (
            <button
              type="button"
              onClick={() => { setZoom(false); setIndex(videoSlideIndex); }}
              aria-label="Voir la vidéo"
              aria-current={isVideoSlide}
              className={`relative w-12 sm:w-14 aspect-[3/4] flex-shrink-0 overflow-hidden rounded-lg border-2 cursor-pointer transition-all duration-(--motion-fast) ${
                isVideoSlide
                  ? 'border-brand-gold opacity-100'
                  : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
              }`}
            >
              <Image src={images[0]} alt="" fill sizes="56px" className="object-cover opacity-50" />
              <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                <Play size={14} className="text-brand-gold" />
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
