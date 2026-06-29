'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCatalog } from '@/context/CatalogContext';
import { fetchActiveAssetBySection } from '@/services/mediaService';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { cartCount, setCartOpen } = useCart();
  const { categories, searchProducts } = useCatalog();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [logoUrl, setLogoUrl] = useState('/images/LOGOSITE/logo.png');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const mountedTimer = setTimeout(async () => {
      setIsMounted(true);
      const activeLogo = await fetchActiveAssetBySection('logo');
      if (activeLogo && activeLogo.url) {
        setLogoUrl(activeLogo.url);
      }
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
  }, []);

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
      className={`sticky top-0 left-0 w-full z-50 transition-all duration-500 bg-brand-bg border-b border-brand-gold/20 shadow-md ${
        isScrolled ? 'py-3 bg-brand-bg/95 backdrop-blur-md shadow-lg' : 'py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="relative w-28 h-12 flex-shrink-0">
          <Image
            src={logoUrl}
            alt="HP Collection Logo"
            fill
            sizes="128px"
            priority
            className="object-contain"
            unoptimized
          />
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`font-bebas text-lg tracking-wider transition-colors hover:text-brand-gold ${
                  isActive ? 'text-brand-gold border-b border-brand-gold' : 'text-brand-text'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-5">
          <form
            onSubmit={handleSearchSubmit}
            className={`flex items-center border border-brand-gold/20 rounded-full px-3 py-1 bg-brand-bg-alt/50 transition-all duration-300 ${
              isSearchOpen ? 'w-48 sm:w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none md:opacity-100 md:w-48 md:pointer-events-auto'
            }`}
          >
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="bg-transparent border-none text-brand-text text-sm focus:outline-none w-full"
            />
            <button type="submit" className="text-brand-gold hover:text-brand-gold-light cursor-pointer">
              <Search size={18} />
            </button>
          </form>

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-1 text-brand-text hover:text-brand-gold transition-colors md:hidden"
          >
            <Search size={22} />
          </button>

          <button
            onClick={() => setCartOpen(true)}
            className="relative p-1 text-brand-text hover:text-brand-gold transition-all duration-300 hover:scale-105"
            aria-label="Panier d'achat"
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
            className="p-1 text-brand-text hover:text-brand-gold transition-colors md:hidden"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-brand-bg-alt border-t border-brand-gold/10 px-4 py-6 space-y-4 shadow-xl">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block font-bebas text-xl tracking-wider py-2 border-b border-brand-gold/5 ${
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
