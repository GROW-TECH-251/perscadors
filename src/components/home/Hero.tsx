'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export const Hero: React.FC = () => {
  const [videoSrc, setVideoSrc] = useState<string>('');

  useEffect(() => {
    // Defer loading the massive video until after the critical page rendering is complete
    const timer = setTimeout(() => {
      setVideoSrc('/images/ARRIEREPLAN/7679830-uhd_4096_2160_25fps.mp4');
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative w-full h-[calc(100vh-80px)] min-h-[600px] flex items-center justify-center overflow-hidden bg-black text-[#EDEAE3]"
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-65"
      >
        {videoSrc && (
          <source
            src={videoSrc}
            type="video/mp4"
          />
        )}
        Your browser does not support the video tag.
      </video>

      {/* Luxury Golden Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-black/60 z-10" />

      {/* Content wrapper - Centered */}
      <div className="relative z-20 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col items-center justify-center">
        
        {/* Action CTAs Centered */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up-fade"
        >
          <Link
            href="#categories"
            className="w-full sm:w-auto px-8 py-4 bg-brand-gold hover:bg-brand-gold-light text-[#0A0A0A] font-bebas text-xl tracking-widest uppercase transition-all duration-300 hover:scale-105 rounded shadow-lg text-center"
          >
            Voir la collection
          </Link>
          <Link
            href="#carousel-outfits"
            className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white hover:border-brand-gold hover:text-brand-gold text-white font-bebas text-xl tracking-widest uppercase transition-all duration-300 hover:scale-105 rounded text-center"
          >
            Voir les outfits
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer animate-bounce opacity-80">
        <span className="font-bebas text-sm tracking-widest uppercase text-brand-gold">Défiler</span>
        <div className="w-1 h-8 bg-brand-gold rounded-full" />
      </div>
    </section>
  );
};
