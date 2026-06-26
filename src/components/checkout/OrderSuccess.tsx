'use client';

import React from 'react';
import { CheckCircle, MessageCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Order } from '@/types';

interface OrderSuccessProps {
  order: Order;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({ order }) => {
  const handleWhatsAppRedirection = () => {
    let message = `🛒 *NOUVELLE COMMANDE PERSCADORS*\n\n`;
    message += `*N° Commande:* #${order.id}\n`;
    message += `*Client:* ${order.customer.name}\n`;
    message += `*Téléphone:* ${order.customer.phone}\n`;
    message += `*Ville:* ${order.customer.city}\n`;
    message += `*Adresse:* ${order.customer.address}\n\n`;
    message += `*Articles:*\n`;
    order.items.forEach((item) => {
      message += `- ${item.quantity}x ${item.product.name} (${item.selectedSize}) | ${(item.product.price * item.quantity).toLocaleString()} FCFA\n`;
    });
    message += `\n*TOTAL: ${order.total.toLocaleString()} FCFA*\n\n`;
    message += `🔗 Suivi de commande: ${window.location.origin}/order/${order.token}\n\n`;
    message += `_Je souhaite confirmer ma commande et procéder au paiement._`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/22967280018?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center text-center py-8 h-full">
      <div className="mb-6 text-brand-gold animate-bounce">
        <CheckCircle size={80} />
      </div>

      <h3 className="font-bebas text-3xl text-brand-text mb-2 tracking-wider">
        Commande Enregistrée !
      </h3>
      
      <p className="text-brand-text-muted mb-8 max-w-xs mx-auto">
        Merci pour votre confiance. Votre numéro de commande est le <span className="text-brand-gold font-bold">#{order.id}</span>.
      </p>

      <div className="w-full space-y-4">
        <button
          onClick={handleWhatsAppRedirection}
          className="w-full py-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bebas text-xl uppercase tracking-widest rounded transition-all shadow-lg flex items-center justify-center gap-3"
        >
          <MessageCircle size={24} />
          Finaliser sur WhatsApp
        </button>

        <Link 
          href={`/order/${order.token}`}
          className="w-full py-3 border border-brand-gold/20 hover:bg-brand-gold/5 text-brand-gold font-bebas text-lg uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
        >
          Voir le reçu / Suivi
          <ExternalLink size={18} />
        </Link>
      </div>

      <p className="mt-8 text-xs text-brand-text-muted italic px-4">
        N'oubliez pas d'envoyer le message WhatsApp pour que nous puissions valider votre commande et organiser la livraison.
      </p>
    </div>
  );
};

export default OrderSuccess;
