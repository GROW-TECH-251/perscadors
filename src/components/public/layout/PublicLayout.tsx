// src/components/layout/PublicLayout.tsx
// ============================================
// Layout pour les pages PUBLIQUES uniquement (Zéro Erreur DOM Nesting)
// ============================================

'use client';

import React from 'react';
import { Navbar } from '@/components/public/layout/Navbar';
import { Footer } from '@/components/public/layout/Footer';
import { WhatsAppFloat } from '@/components/public/layout/WhatsAppFloat';
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
