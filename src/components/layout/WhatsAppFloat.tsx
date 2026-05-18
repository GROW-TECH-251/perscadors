'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppFloat: React.FC = () => {
  return (
    <a
      href="https://wa.me/22967280018?text=Bonjour%20Vioutou%20!%20Je%20viens%20du%20site%20HP%20Collection%20et%20j'aimerais%20discuter%20de%20vos%20outfits."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-2 group cursor-pointer border border-white/20"
      aria-label="Deal avec Vioutou"
    >
      {/* Tooltip */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap font-bebas text-lg uppercase tracking-wider group-hover:max-w-xs transition-all duration-500 ease-in-out pr-0 group-hover:pr-2">
        Deal avec Vioutou
      </span>
      <MessageCircle size={24} className="animate-pulse" />
    </a>
  );
};
