'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, Plus, Minus, MessageSquareCode } from 'lucide-react';
import Image from 'next/image';
import { CheckoutDrawer } from '@/components/checkout/CheckoutDrawer';

export const CartDrawer: React.FC = () => {
  const { cartItems, isCartOpen, setCartOpen, updateQuantity, removeFromCart, cartTotal } = useCart();
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setCartOpen(false)}
        />

        {/* Drawer */}
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-brand-bg text-brand-text flex flex-col border-l border-brand-gold/20 shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-brand-gold/10 flex items-center justify-between">
              <h2 className="text-2xl font-bebas text-brand-gold tracking-wider">Mon Panier</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-brand-bg-alt rounded-full transition-colors text-brand-text-muted hover:text-brand-text"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-brand-bg-alt flex items-center justify-center rounded-full text-brand-gold">
                    🛒
                  </div>
                  <p className="text-brand-text-muted font-medium">Votre panier est vide.</p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="px-6 py-2 bg-brand-gold hover:bg-brand-gold-light text-brand-bg rounded-md font-bebas text-lg uppercase tracking-wider transition-colors"
                  >
                    Continuer le Shopping
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                    className="flex gap-4 p-3 bg-brand-bg-alt rounded-lg border border-brand-gold/5 relative group"
                  >
                    <div className="relative w-20 h-24 overflow-hidden rounded bg-brand-bg flex-shrink-0">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bebas text-lg leading-tight tracking-wide pr-6">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-brand-text-muted mt-1">
                          Taille : <span className="font-semibold text-brand-text">{item.selectedSize}</span> | Couleur :{' '}
                          <span className="font-semibold text-brand-text">{item.selectedColor}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-brand-gold/20 rounded bg-brand-bg">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)
                            }
                            className="px-2 py-1 text-brand-text-muted hover:text-brand-text transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)
                            }
                            className="px-2 py-1 text-brand-text-muted hover:text-brand-text transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div className="font-semibold text-brand-gold">
                          {(item.product.price * item.quantity).toLocaleString()} FCFA
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                      className="absolute top-2 right-2 text-brand-text-muted hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-brand-gold/10 bg-brand-bg-alt space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bebas tracking-wide text-brand-text-muted">Total estimé</span>
                  <span className="text-xl font-bold text-brand-gold">
                    {cartTotal.toLocaleString()} FCFA
                  </span>
                </div>
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  * Votre commande sera confirmée par Vioutou via WhatsApp après validation.
                </p>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="w-full py-4 bg-brand-gold hover:bg-brand-gold-light text-brand-bg font-bebas text-xl uppercase tracking-widest rounded transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <MessageSquareCode size={20} className="group-hover:scale-110 transition-transform" />
                  Commander
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Drawer — monté en dehors du drawer panier */}
      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
};