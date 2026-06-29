'use client';

import React, { createContext, useContext, useState } from 'react';
import { CartItem, Product, Size } from '@/types';

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  addToCart: (product: Product, size: Size, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: Size, color: string) => void;
  updateQuantity: (productId: string, size: Size, color: string, quantity: number) => void;
  addMultipleToCart: (products: Product[]) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function readInitialCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const savedCart = window.localStorage.getItem('hp_cart');
  if (!savedCart) {
    return [];
  }

  try {
    return JSON.parse(savedCart) as CartItem[];
  } catch (error) {
    console.error('Erreur de lecture du panier localStorage', error);
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(readInitialCart);
  const [isCartOpen, setCartOpen] = useState(false);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hp_cart', JSON.stringify(items));
    }
  };

  const addToCart = (product: Product, size: Size, color: string, quantity = 1) => {
    const existingIndex = cartItems.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.selectedSize === size &&
        item.selectedColor === color
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      saveCart(updated);
    } else {
      saveCart([...cartItems, { product, selectedSize: size, selectedColor: color, quantity }]);
    }

    setCartOpen(true);
  };

  const removeFromCart = (productId: string, size: Size, color: string) => {
    const updated = cartItems.filter(
      (item) =>
        !(
          item.product.id === productId &&
          item.selectedSize === size &&
          item.selectedColor === color
        )
    );
    saveCart(updated);
  };

  const updateQuantity = (productId: string, size: Size, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }

    const updated = cartItems.map((item) =>
      item.product.id === productId &&
      item.selectedSize === size &&
      item.selectedColor === color
        ? { ...item, quantity }
        : item
    );

    saveCart(updated);
  };

  const addMultipleToCart = (productsList: Product[]) => {
    const updated = [...cartItems];

    productsList.forEach((product) => {
      const size = product.sizes.find((value) => !product.outOfStockSizes?.includes(value)) || product.sizes[0];
      const color = product.colors.find((value) => !product.outOfStockColors?.includes(value)) || product.colors[0];

      const existingIndex = updated.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      if (existingIndex > -1) {
        updated[existingIndex].quantity += 1;
      } else {
        updated.push({ product, selectedSize: size, selectedColor: color, quantity: 1 });
      }
    });

    saveCart(updated);
    setCartOpen(true);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        addMultipleToCart,
        clearCart,
        setCartOpen,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};