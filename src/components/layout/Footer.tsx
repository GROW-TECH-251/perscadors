'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import { fetchActiveAssetBySection } from '@/services/mediaService';
import type { ShopSettings } from '@/admin/types';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [logoUrl, setLogoUrl] = useState('/images/LOGOSITE/logo.png');

  useEffect(() => {
    async function loadFooter() {
      const [data, activeLogo] = await Promise.all([
        fetchShopSettings(),
        fetchActiveAssetBySection('logo')
      ]);
      if (data) setSettings(data);
      if (activeLogo && activeLogo.url) {
        setLogoUrl(activeLogo.url);
      } else if (data?.logo_url) {
        setLogoUrl(data.logo_url);
      }
    }
    loadFooter();
  }, []);

  return (
    <footer className="bg-[#0A0A0A] text-[#888880] border-t border-brand-gold/20 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Brand Motto column */}
        <div className="space-y-4">
          <Link href="/" className="relative w-36 h-16 block">
            <Image
              src={logoUrl}
              alt={`${settings.shop_name} Logo`}
              fill
              sizes="128px"
              className="object-contain filter brightness-110"
            />
          </Link>
          <p className="font-bebas text-2xl tracking-widest text-[#EDEAE3] pt-2">
            Vioutou t&apos;habille. Tu règnes.
          </p>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            {settings.footer_description}
          </p>
        </div>

        {/* Navigation Categories column */}
        <div>
          <h3 className="font-bebas text-lg tracking-wider text-brand-gold uppercase mb-4">Catégories</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/categorie/basket-pour-homme" className="hover:text-brand-gold transition-colors">
                Baskets pour Homme
              </Link>
            </li>
            <li>
              <Link href="/categorie/complet-pour-homme" className="hover:text-brand-gold transition-colors">
                Complets Streetwear
              </Link>
            </li>
            <li>
              <Link href="/categorie/jean-overside-pour-homme" className="hover:text-brand-gold transition-colors">
                Jeans Oversize
              </Link>
            </li>
            <li>
              <Link href="/categorie/tapettes-pour-homme" className="hover:text-brand-gold transition-colors">
                Claquettes & Sandales
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick Links column */}
        <div>
          <h3 className="font-bebas text-lg tracking-wider text-brand-gold uppercase mb-4">Découvrir</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/looks" className="hover:text-brand-gold transition-colors">
                Looks de Vioutou
              </Link>
            </li>
            <li>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- anchor scroll */}
              <a href="/#temoinages" className="hover:text-brand-gold transition-colors cursor-pointer">
                Avis Clients
              </a>
            </li>
            <li>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- anchor scroll */}
              <a href="/#faq" className="hover:text-brand-gold transition-colors cursor-pointer">
                Foire Aux Questions
              </a>
            </li>
          </ul>
        </div>

        {/* WhatsApp & Benin Info column */}
        <div>
          <h3 className="font-bebas text-lg tracking-wider text-brand-gold uppercase mb-4">Boutique</h3>
          <p className="text-sm leading-relaxed mb-4">
            📍 {settings.country}<br />
            🚚 Livraison {settings.delivery_time} dans tout le pays.<br />
            💬 Commandes instantanées via WhatsApp.
          </p>
          <a
            href={`https://wa.me/${settings.whatsapp_phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-brand-gold hover:bg-brand-gold-light text-[#0A0A0A] font-bebas tracking-widest text-sm uppercase rounded transition-colors"
          >
            Discuter sur WhatsApp
          </a>
        </div>
      </div>

      {/* Copyright border bottom */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-brand-gold/10 text-center text-xs text-brand-text-muted flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} {settings.shop_name}. Tous droits réservés.</p>
        <p>
          Créé pour <span className="text-brand-gold font-semibold">Vioutou</span> | Mode Streetwear Premium {settings.country} 🇧🇯
        </p>
      </div>
    </footer>
  );
};
