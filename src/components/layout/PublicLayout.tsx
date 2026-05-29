// src/components/layout/PublicLayout.tsx
// ============================================
// Layout pour les pages PUBLIQUES uniquement
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
      <main>
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
      <CartDrawer />
    </>
  );
};
