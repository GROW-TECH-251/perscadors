// src/components/cart/CartDrawer.tsx
// ============================================
// Entrée du tunnel de commande premium
// ============================================

'use client';

import React from 'react';
import { CheckoutDrawer } from '@/components/checkout/CheckoutDrawer';
import { useCart } from '@/context/CartContext';

export const CartDrawer: React.FC = () => {
  const { isCartOpen, setCartOpen } = useCart();

  return (
    <CheckoutDrawer
      isOpen={isCartOpen}
      onClose={() => setCartOpen(false)}
    />
  );
};