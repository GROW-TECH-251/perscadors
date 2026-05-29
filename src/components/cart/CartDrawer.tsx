// src/components/cart/CartDrawer.tsx
// ============================================
// Panier avec tirage
// ============================================

'use client';

import React from 'react';
import { X, Minus, Plus, Trash2, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const CartDrawer: React.FC = () => {
  const { 
    cartItems, 
    isCartOpen, 
    setCartOpen, 
    removeFromCart, 
    updateQuantity, 
    cartTotal,
    clearCart 
  } = useCart();

  const handleWhatsAppCheckout = () => {
    let message = '🛒 *Nouvelle Commande HP Collection*\n\n';
    cartItems.forEach((item) => {
      message += `• ${item.product.name}\n`;
      message += `  Taille: ${item.selectedSize} | Couleur: ${item.selectedColor}\n`;
      message += `  Quantité: ${item.quantity} | Prix: ${(item.product.price * item.quantity).toLocaleString()} FCFA\n\n`;
    });
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `*TOTAL: ${cartTotal.toLocaleString()} FCFA*\n\n`;
    message += '_Votre commande sera préparée automatiquement et envoyée à Vioutou via WhatsApp pour validation finale et livraison._';

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/22967280018?text=${encodedMessage}`, '_blank');
  };

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-brand-bg shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-brand-gold/10">
          <h2 className="font-bebas text-2xl tracking-wider text-brand-text uppercase">
            Ton Panier
          </h2>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 hover:bg-brand-gold/10 rounded-full transition-colors cursor-pointer"
            type="button"
            aria-label="Fermer le panier"
          >
            <X size={24} className="text-brand-text" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-6xl">🛒</div>
              <p className="text-brand-text-muted text-lg">Votre panier est vide.</p>
              <button
                onClick={() => setCartOpen(false)}
                className="mt-4 px-6 py-3 bg-brand-gold hover:bg-brand-gold-light text-[#0A0A0A] font-bebas uppercase tracking-widest rounded cursor-pointer"
                type="button"
              >
                Découvrir la collection
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                className="flex gap-4 p-4 bg-brand-bg-alt rounded-lg border border-brand-gold/5"
              >
                <div className="relative w-20 h-24 flex-shrink-0 overflow-hidden rounded bg-brand-bg">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                      📦
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bebas text-lg text-brand-text truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-brand-text-muted mt-1">
                    Taille : {item.selectedSize} | Couleur : {item.selectedColor}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                      className="p-1 hover:bg-brand-gold/10 rounded transition-colors cursor-pointer"
                      type="button"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus size={16} className="text-brand-text" />
                    </button>
                    <span className="text-brand-text font-semibold w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                      className="p-1 hover:bg-brand-gold/10 rounded transition-colors cursor-pointer"
                      type="button"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus size={16} className="text-brand-text" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                      className="ml-auto p-1 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      type="button"
                      aria-label="Supprimer l'article"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-brand-gold">
                    {(item.product.price * item.quantity).toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-brand-gold/10 p-6 space-y-4 bg-brand-bg-alt">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bebas text-brand-text-muted">Total estimé</span>
              <span className="text-2xl font-bold text-brand-gold">
                {cartTotal.toLocaleString()} FCFA
              </span>
            </div>

            <button
              onClick={handleWhatsAppCheckout}
              className="w-full py-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bebas text-xl uppercase tracking-widest rounded transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <MessageCircle size={22} />
              Commander via WhatsApp
            </button>

            <p className="text-xs text-brand-text-muted text-center leading-relaxed">
              * Votre commande sera préparée automatiquement et envoyée à Vioutou via WhatsApp pour validation finale et livraison.
            </p>

            <button
              onClick={clearCart}
              className="w-full py-2 text-brand-text-muted hover:text-red-500 text-sm transition-colors cursor-pointer"
              type="button"
            >
              Vider le panier
            </button>
          </div>
        )}
      </div>
    </>
  );
};