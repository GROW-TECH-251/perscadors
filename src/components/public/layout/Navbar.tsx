'use client';

import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCatalog } from '@/context/CatalogContext';
import { fetchActiveAssetBySection } from '@/services/mediaService';
import { fetchPublicShopSettings } from '@/services/settingsService';
import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { cartCount, setCartOpen } = useCart();
  const { categories, searchProducts } = useCatalog();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [logoUrl, setLogoUrl] = useState('/assets/brand/logo.png');
  const [realtimeVersion, setRealtimeVersion] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const mountedTimer = setTimeout(async () => {
      setIsMounted(true);
      const [settings, activeLogo] = await Promise.all([fetchPublicShopSettings(), fetchActiveAssetBySection('logo')]);
      // Un logo défini dans Réglages est prioritaire sur la bibliothèque médias.
      if (settings?.logo_url) setLogoUrl(settings.logo_url);
      else if (activeLogo?.url) setLogoUrl(activeLogo.url);
    }, 0);

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(mountedTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [realtimeVersion]);

  // DERNIÈRE IMPLÉMENTATION — Mode narratif (home uniquement) : la
  // navigation ne fait pas partie de l'ouverture du site. Tant que le
  // hero est à l'écran (bottom > 0 — ce qui couvre AUSSI toute la phase
  // intro, où le hero est encore sous le viewport), la navbar est hors
  // flux et invisible ; elle revient en overlay FIXE dès que le hero est
  // entièrement dépassé — sans jamais réintégrer le flux, donc sans
  // déplacement de contenu ni CLS — et se retire si l'utilisateur
  // remonte dans le hero. Déterministe : une seule mesure réelle (rect
  // du hero), évaluée au rAF ; aucun timer, aucune hauteur codée en
  // dur. Les pages sans séquence narrative (pas de #pescador-intro ou
  // pas de #pescador-hero) gardent la navbar sticky standard.
  const [heroOverlay, setHeroOverlay] = useState(false);
  const [narrativeHidden, setNarrativeHidden] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('pescador-hero');
    const intro = document.getElementById('pescador-intro');
    if (!hero || !intro) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      setHeroOverlay(true);
      setNarrativeHidden(hero.getBoundingClientRect().bottom > 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    // Première évaluation asynchrone (rAF) — l'état pré-hydratation est
    // couvert par la règle CSS pré-paint (globals.css, :has).
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useShopSettingsRealtime(() => { setRealtimeVersion((version) => version + 1); });
  useSiteAssetsRealtime(() => { setRealtimeVersion((version) => version + 1); });

  const navLinks = useMemo(() => {
    const categoryLinks = categories.slice(0, 4).map((category) => ({
      name: category.name,
      href: `/categorie/${category.slug}`
    }));

    return [
      { name: 'Accueil', href: '/' },
      ...categoryLinks,
      { name: 'HP Looks', href: '/looks' }
    ];
  }, [categories]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!searchQuery.trim()) {
      return;
    }

    const normalizedQuery = searchQuery.toLowerCase().trim();
    const matchedProduct = searchProducts(normalizedQuery)[0];
    const matchedCategory = categories.find((category) => {
      return (
        category.name.toLowerCase().includes(normalizedQuery) ||
        category.slug.toLowerCase().includes(normalizedQuery)
      );
    });

    if (matchedProduct) {
      router.push(`/produit/${matchedProduct.id}`);
    } else if (matchedCategory) {
      router.push(`/categorie/${matchedCategory.slug}`);
    } else {
      const fallbackCategorySlug = categories[0]?.slug || 'basket-pour-homme';
      router.push(`/categorie/${fallbackCategorySlug}?search=${encodeURIComponent(searchQuery)}`);
    }

    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    setSearchQuery('');
  };

  return (
    <nav
      className={`pescador-navbar top-0 left-0 w-full z-50 border-b transition-all duration-(--motion-smooth) ease-out-luxe ${
        heroOverlay ? 'fixed' : 'sticky'
      } ${heroOverlay && narrativeHidden ? '-translate-y-full pointer-events-none' : 'translate-y-0'} ${
        isScrolled
          ? 'py-3 bg-brand-bg/90 backdrop-blur-lg border-brand-gold/30 shadow-lg'
          : 'py-5 bg-brand-bg/80 backdrop-blur-sm border-brand-gold/20 shadow-md'
      }`}
      // Mode narratif caché : retiré de l'ordre de tabulation (le focus ne
      // doit pas atteindre une navigation invisible).
      inert={heroOverlay && narrativeHidden ? true : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="relative w-36 h-16 sm:w-28 sm:h-12 flex-shrink-0">
          <Image
            src={logoUrl}
            alt="HP Collection Logo"
            fill
            sizes="128px"
            priority
            className="object-contain"
          />
        </Link>

        <div className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`nav-link font-bebas text-lg tracking-wider hover:text-brand-gold ${
                  isActive ? 'nav-link--active text-brand-gold' : 'text-brand-text'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-5">
          <form
            onSubmit={handleSearchSubmit}
            className={`flex items-center border border-brand-gold/20 rounded-full px-3 py-1 bg-brand-bg-alt/95 transition-all duration-(--motion-fast) ease-out-luxe ${
              isSearchOpen ? 'absolute right-12 top-4 w-[calc(100%-40px)] max-w-[240px] sm:relative sm:right-0 sm:top-0 sm:w-64 opacity-100 z-50 shadow-lg backdrop-blur-sm' : 'w-0 opacity-0 pointer-events-none lg:opacity-100 lg:w-48 lg:pointer-events-auto'
            }`}
          >
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="bg-transparent border-none text-brand-text text-sm focus:outline-none w-full"
            />
            <button type="submit" className="text-brand-gold hover:text-brand-gold-light cursor-pointer" aria-label="Valider la recherche" title="Valider la recherche">
              <Search size={18} />
            </button>
          </form>

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-1 text-brand-text hover:text-brand-gold transition-colors lg:hidden"
            aria-label="Ouvrir la barre de recherche"
            title="Ouvrir la barre de recherche"
          >
            <Search size={22} />
          </button>

          <button
            onClick={() => setCartOpen(true)}
            className="relative p-1 text-brand-text hover:text-brand-gold transition-all duration-(--motion-fast) ease-out-expo hover:scale-105"
            aria-label="Panier d'achat"
            title="Panier d'achat"
          >
            <ShoppingBag size={24} />
            {isMounted && cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-brand-bg animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-brand-text hover:text-brand-gold transition-colors lg:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-label="Menu principal de navigation"
            title="Menu principal de navigation"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-brand-bg-alt/95 backdrop-blur-md border-t border-brand-gold/10 px-4 py-6 space-y-4 shadow-xl animate-nav-panel">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block font-bebas text-xl tracking-wider py-2 border-b border-brand-gold/5 truncate ${
                  isActive ? 'text-brand-gold pl-2 border-l-2 border-brand-gold' : 'text-brand-text'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};
