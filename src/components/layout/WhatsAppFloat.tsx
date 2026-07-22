'use client';

import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { fetchShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import type { ShopSettings } from '@/admin/types';

export const WhatsAppFloat: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());

  useEffect(() => {
    async function loadWhatsAppFloat() {
      const data = await fetchShopSettings();
      if (data) setSettings(data);
    }
    loadWhatsAppFloat();
  }, []);

  useShopSettingsRealtime(() => { window.location.reload(); });

  return (
    <a
      href={`https://wa.me/${settings.whatsapp_phone}?text=${encodeURIComponent(settings.floating_whatsapp_text)}`}
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
