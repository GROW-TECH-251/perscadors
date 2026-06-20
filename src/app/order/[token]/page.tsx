// src/app/order/[token]/page.tsx
import { supabase } from '@/lib/supabase';
import type { OrderStatus } from '@/types';
import { Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ReactNode; color: string }> = {
  'EN ATTENTE': {
    label: 'En attente de confirmation',
    icon: <Clock size={40} />,
    color: 'text-amber-400',
  },
  'CONFIRMÉE': {
    label: 'Commande confirmée',
    icon: <Package size={40} />,
    color: 'text-blue-400',
  },
  'EN LIVRAISON': {
    label: 'En cours de livraison',
    icon: <Truck size={40} />,
    color: 'text-purple-400',
  },
  'LIVRÉE': {
    label: 'Commande livrée',
    icon: <CheckCircle2 size={40} />,
    color: 'text-green-400',
  },
  'ANNULÉE': {
    label: 'Commande annulée',
    icon: <XCircle size={40} />,
    color: 'text-red-400',
  },
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!supabase) {
    return <ErrorState message="Service indisponible." />;
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('order_number, status, client_name, items, grand_total, created_at, history')
    .eq('public_token', token)
    .single();

  if (error || !order) {
    return <ErrorState message="Commande introuvable." />;
  }

  const config = STATUS_CONFIG[order.status as OrderStatus];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">

        {/* En-tête */}
        <div className="text-center">
          <p className="font-bebas text-brand-gold tracking-widest text-lg">HP COLLECTION</p>
          <h1 className="font-bebas text-3xl tracking-wide mt-1">Suivi de commande</h1>
        </div>

        {/* Statut */}
        <div className="bg-brand-bg-alt rounded-xl border border-brand-gold/10 p-6 text-center space-y-3">
          <div className={`flex justify-center ${config.color}`}>
            {config.icon}
          </div>
          <p className={`font-bebas text-xl tracking-wide ${config.color}`}>
            {config.label}
          </p>
          <p className="text-xs text-brand-text-muted uppercase tracking-wider">
            Réf. {order.order_number}
          </p>
        </div>

        {/* Infos commande */}
        <div className="bg-brand-bg-alt rounded-xl border border-brand-gold/10 p-4 space-y-3">
          <p className="font-bebas text-brand-gold tracking-wide">Détails</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-text-muted">Client</span>
              <span>{order.client_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-muted">Articles</span>
              <span>{(order.items as []).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-muted">Total</span>
              <span className="text-brand-gold font-semibold">
                {Number(order.grand_total).toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        {/* Historique */}
        {order.history && (order.history as []).length > 0 && (
          <div className="bg-brand-bg-alt rounded-xl border border-brand-gold/10 p-4 space-y-3">
            <p className="font-bebas text-brand-gold tracking-wide">Historique</p>
            <div className="space-y-2">
              {(order.history as Array<{ status: string; date: string; note?: string }>)
                .slice()
                .reverse()
                .map((entry, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{entry.status}</p>
                      <p className="text-brand-text-muted text-xs">
                        {new Date(entry.date).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      {entry.note && (
                        <p className="text-brand-text-muted text-xs">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-brand-text-muted">
          Pour toute question, contacte Vioutou sur WhatsApp.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <XCircle size={48} className="text-red-400 mx-auto" />
        <p className="font-bebas text-xl">{message}</p>
        <a href="/" className="text-brand-gold text-sm underline">Retour à l'accueil</a>
      </div>
    </div>
  );
}