'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';
import { products } from '@/data/products';

export const Navbar: React.FC = () => {
  const { cartCount, setCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Find matches across products
      const query = searchQuery.toLowerCase().trim();
      const matchedProduct = products.find(
        (p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
      );

      if (matchedProduct) {
        router.push(`/produit/${matchedProduct.id}`);
        setIsSearchOpen(false);
        setSearchQuery('');
      } else {
        // Redirect to first category matching
        router.push(`/categorie/basket-pour-homme?search=${encodeURIComponent(searchQuery)}`);
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    }
  };

  const navLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'Baskets', href: '/categorie/basket-pour-homme' },
    { name: 'Complets', href: '/categorie/complet-pour-homme' },
    { name: 'Jeans Oversize', href: '/categorie/jean-overside-pour-homme' },
    { name: 'Tapettes', href: '/categorie/tapettes-pour-homme' },
    { name: 'HP Looks', href: '/looks' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${
        isScrolled
          ? 'bg-brand-bg/95 border-b border-brand-gold/15 shadow-lg backdrop-blur-md py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="relative w-28 h-12 flex-shrink-0">
          <Image
            src="/images/LOGOSITE/logo.png"
            alt="HP Collection Logo"
            fill
            priority
            className="object-contain"
          />
        </Link>

        {/* Desktop Nav Links */}
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

        {/* Search, Cart & Mobile Menu Toggle */}
        <div className="flex items-center space-x-5">
          {/* Expanding Search Bar */}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-brand-text text-sm focus:outline-none w-full"
            />
            <button type="submit" className="text-brand-gold hover:text-brand-gold-light cursor-pointer">
              <Search size={18} />
            </button>
          </form>

          {/* Search Toggle for Mobile */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-1 text-brand-text hover:text-brand-gold transition-colors md:hidden"
          >
            <Search size={22} />
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-1 text-brand-text hover:text-brand-gold transition-all duration-300 hover:scale-105"
          >
            <ShoppingBag size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-brand-bg animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-brand-text hover:text-brand-gold transition-colors md:hidden"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
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
