// src/components/cart/CartDrawer.tsx
// ============================================
// Panier avec checkout WhatsApp + enregistrement admin
// ============================================

'use client';

import React, { useMemo, useState } from 'react';
import { X, Minus, Plus, Trash2, MessageCircle, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  buildWhatsAppOrderMessage,
  createOrderFromCart,
  generateOrderNumber,
  normalizePhoneForWhatsApp,
  type PublicCheckoutPayload
} from '@/services/orderService';

const WHATSAPP_DIGITS = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DIGITS?.trim() || '22967280018';

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

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerArea, setCustomerArea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');

  const canCheckout = useMemo(() => {
    return (
      cartItems.length > 0 &&
      customerName.trim().length > 1 &&
      customerPhone.trim().length >= 8 &&
      customerArea.trim().length > 1
    );
  }, [cartItems.length, customerArea, customerName, customerPhone]);

  const resetCheckoutState = () => {
    setCheckoutError('');
    setCheckoutSuccess('');
  };

  const resetCheckoutForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerArea('');
    resetCheckoutState();
  };

  const handleClose = () => {
    setCartOpen(false);
    resetCheckoutState();
  };

  const handleWhatsAppCheckout = async () => {
    if (cartItems.length === 0) {
      setCheckoutError('Votre panier est vide.');
      return;
    }

    if (!customerName.trim()) {
      setCheckoutError('Veuillez renseigner votre nom complet.');
      return;
    }

    if (!customerPhone.trim()) {
      setCheckoutError('Veuillez renseigner votre numéro WhatsApp.');
      return;
    }

    if (!customerArea.trim()) {
      setCheckoutError('Veuillez renseigner votre zone de livraison.');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError('');
    setCheckoutSuccess('');

    const whatsappWindow = typeof window !== 'undefined'
      ? window.open('', '_blank', 'noopener,noreferrer')
      : null;

    try {
      const orderPayload: PublicCheckoutPayload = {
        order_number: generateOrderNumber(),
        client_name: customerName.trim(),
        client_phone: normalizePhoneForWhatsApp(customerPhone),
        client_area: customerArea.trim(),
        items: cartItems.map((item) => ({
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          size: item.selectedSize,
          color: item.selectedColor,
          image: item.product.image_url || item.product.images[0]
        })),
        subtotal: cartTotal,
        delivery_fee: 0,
        total: cartTotal
      };

      if (isSupabaseConfigured) {
        const creationResult = await createOrderFromCart(orderPayload);

        if (creationResult.error) {
          whatsappWindow?.close();
          setCheckoutError(`La commande n'a pas pu être enregistrée dans l'admin : ${creationResult.error}`);
          return;
        }
      }

      const message = buildWhatsAppOrderMessage(orderPayload);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_DIGITS}?text=${encodedMessage}`;

      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank');
      }

      clearCart();
      setCheckoutSuccess(
        isSupabaseConfigured
          ? `Commande ${orderPayload.order_number} enregistrée et envoyée sur WhatsApp.`
          : 'Commande préparée et envoyée sur WhatsApp. Configure Supabase pour la voir remonter dans l’admin.'
      );
      setCustomerName('');
      setCustomerPhone('');
      setCustomerArea('');

      window.setTimeout(() => {
        setCartOpen(false);
      }, 1200);
    } catch (error: unknown) {
      whatsappWindow?.close();
      console.error('Erreur checkout WhatsApp:', error);
      setCheckoutError('Une erreur est survenue pendant la préparation de votre commande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-brand-bg shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-brand-gold/10">
          <h2 className="font-bebas text-2xl tracking-wider text-brand-text uppercase">
            Ton Panier
          </h2>
          <button
            onClick={handleClose}
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
                onClick={handleClose}
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

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-muted mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Ex: Honoré Perscadors"
                  className="w-full px-4 py-3 rounded-lg border border-brand-gold/20 bg-brand-bg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-muted mb-1">
                  Numéro WhatsApp
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Ex: +229 67 28 00 18"
                  className="w-full px-4 py-3 rounded-lg border border-brand-gold/20 bg-brand-bg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-muted mb-1">
                  Zone de livraison
                </label>
                <input
                  type="text"
                  value={customerArea}
                  onChange={(event) => setCustomerArea(event.target.value)}
                  placeholder="Ex: Cotonou, Agla"
                  className="w-full px-4 py-3 rounded-lg border border-brand-gold/20 bg-brand-bg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                />
              </div>
            </div>

            {checkoutError && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {checkoutError}
              </div>
            )}

            {checkoutSuccess && (
              <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                {checkoutSuccess}
              </div>
            )}

            <button
              onClick={handleWhatsAppCheckout}
              disabled={!canCheckout || isSubmitting}
              className="w-full py-4 bg-[#25D366] hover:bg-[#20BA5A] disabled:bg-[#25D366]/50 disabled:cursor-not-allowed text-white font-bebas text-xl uppercase tracking-widest rounded transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Préparation de la commande...
                </>
              ) : (
                <>
                  <MessageCircle size={22} />
                  Commander via WhatsApp
                </>
              )}
            </button>

            <p className="text-xs text-brand-text-muted text-center leading-relaxed">
              {isSupabaseConfigured
                ? '* Votre commande est enregistrée dans le dashboard admin avant l’ouverture de WhatsApp.'
                : '* Supabase n’est pas configuré : la commande partira sur WhatsApp mais ne remontera pas dans l’admin.'}
            </p>

            <button
              onClick={() => {
                clearCart();
                resetCheckoutForm();
              }}
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