// src/components/layout/PublicLayout.tsx
// ============================================
// Layout pour les pages PUBLIQUES uniquement (Zéro Erreur DOM Nesting)
// ============================================

'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { WhatsAppFloat } from './WhatsAppFloat';
import { CartDrawer } from '@/components/cart/CartDrawer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <>
      <Navbar />
      <div className="w-full">
        {children}
      </div>
      <Footer />
      <WhatsAppFloat />
      <CartDrawer />
    </>
  );
};
