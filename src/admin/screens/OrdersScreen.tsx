// src/admin/screens/OrdersScreen.tsx
// ============================================
// Écran de gestion des commandes
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminBadge, AdminModal, AdminSelect, AdminTextarea } from '../components';
import { ShoppingCart, Eye, MessageCircle, Copy, FileText } from 'lucide-react';
import { fetchAdminOrders, updateOrderStatus } from '@/services/orderService';
import { fetchShopSettings, formatWhatsAppMessage } from '@/services/settingsService';
import type { AdminOrder, OrderStatus } from '@/admin/types';

interface OrdersScreenProps {
  onBack: () => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch (err: unknown) {
      console.error('Erreur chargement commandes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await loadOrders();
    };
    loadData();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: unknown) {
      console.error('Erreur mise à jour statut:', err);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Message copié !');
    } catch (err: unknown) {
      console.error('Erreur copie:', err);
    }
  };

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client_phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'EN ATTENTE': return 'warning';
      case 'CONFIRMÉE': return 'info';
      case 'EN LIVRAISON': return 'info';
      case 'LIVRÉE': return 'success';
      case 'ANNULÉE': return 'danger';
      default: return 'default';
    }
  };

  const getWhatsAppFollowupMessage = (order: AdminOrder) => {
    const templates = {
      'EN ATTENTE': 'Bonjour {clientName}, votre commande {orderId} est en attente de validation.',
      'CONFIRMÉE': 'Bonjour {clientName}, votre commande {orderId} est confirmée. Nous vous contactons pour la livraison.',
      'EN LIVRAISON': 'Bonjour {clientName}, votre commande {orderId} est en cours de livraison.',
      'LIVRÉE': 'Bonjour {clientName}, votre commande {orderId} a été livrée. Merci pour votre confiance !',
      'ANNULÉE': 'Bonjour {clientName}, votre commande {orderId} a été annulée.'
    };

    return formatWhatsAppMessage(templates[order.status] || '', {
      clientName: order.client_name,
      orderId: order.order_number
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
            Commandes
          </h1>
          <p className="text-brand-text-muted mt-1">
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </p>
        </div>
        <AdminButton variant="secondary" size="md" onClick={onBack}>
          Retour
        </AdminButton>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <AdminSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher (réf, client, téléphone)..."
          className="flex-1"
        />
        <AdminSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as OrderStatus | 'all')}
          options={[
            { value: 'all', label: 'Tous les statuts' },
            { value: 'EN ATTENTE', label: 'En attente' },
            { value: 'CONFIRMÉE', label: 'Confirmée' },
            { value: 'EN LIVRAISON', label: 'En livraison' },
            { value: 'LIVRÉE', label: 'Livrée' },
            { value: 'ANNULÉE', label: 'Annulée' }
          ]}
          className="sm:w-48"
        />
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <AdminEmptyState
          icon={<ShoppingCart size={48} />}
          title="Aucune commande trouvée"
          description={searchQuery || statusFilter !== 'all' ? 'Essayez d\'autres filtres' : 'Les commandes apparaîtront ici'}
        />
      ) : (
        <AdminCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-bg-alt">
                <tr className="border-b border-brand-gold/20">
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Référence
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Client
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Téléphone
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-brand-gold/10 hover:bg-brand-gold/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-mono text-brand-text">
                      {order.order_number}
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-text">
                      {order.client_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-text">
                      {order.client_phone}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-brand-gold">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <AdminBadge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </AdminBadge>
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-text-muted">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-2 hover:bg-brand-gold/10 rounded transition-colors cursor-pointer"
                          title="Voir détails"
                          aria-label="Voir détails"
                        >
                          <Eye size={16} className="text-brand-text" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <AdminModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedOrder(null);
          }}
          title={`Commande ${selectedOrder.order_number}`}
          footer={
            <div className="flex gap-3">
              <AdminButton
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedOrder(null);
                }}
              >
                Fermer
              </AdminButton>
              {selectedOrder.status === 'EN ATTENTE' && (
                <AdminButton
                  variant="success"
                  onClick={() => handleStatusChange(selectedOrder.id, 'CONFIRMÉE')}
                >
                  Marquer confirmée
                </AdminButton>
              )}
              {selectedOrder.status === 'CONFIRMÉE' && (
                <AdminButton
                  variant="success"
                  onClick={() => handleStatusChange(selectedOrder.id, 'LIVRÉE')}
                >
                  Marquer livrée
                </AdminButton>
              )}
            </div>
          }
        >
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Client</p>
                <p className="font-medium text-brand-text">{selectedOrder.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Téléphone</p>
                <p className="font-medium text-brand-text">{selectedOrder.client_phone}</p>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Zone de livraison</p>
                <p className="font-medium text-brand-text">{selectedOrder.client_area}</p>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Date</p>
                <p className="font-medium text-brand-text">
                  {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <p className="text-sm text-brand-text-muted mb-3">Articles</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-brand-bg-alt rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium text-brand-text">{item.name}</p>
                        <p className="text-xs text-brand-text-muted">
                          Taille: {item.size} | Couleur: {item.color} | Qté: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-brand-gold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-brand-gold/20 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Sous-total</span>
                <span className="text-brand-text">{formatCurrency(selectedOrder.subtotal || 0)}</span>
              </div>
              {(selectedOrder.delivery_fee || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-muted">Livraison</span>
                  <span className="text-brand-text">{formatCurrency(selectedOrder.delivery_fee || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span className="text-brand-text">Total</span>
                <span className="text-brand-gold">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Status Change */}
            <div>
              <p className="text-sm text-brand-text-muted mb-3">Changer le statut</p>
              <AdminSelect
                value={selectedOrder.status}
                onChange={(v) => handleStatusChange(selectedOrder.id, v as OrderStatus)}
                options={[
                  { value: 'EN ATTENTE', label: 'En attente' },
                  { value: 'CONFIRMÉE', label: 'Confirmée' },
                  { value: 'EN LIVRAISON', label: 'En livraison' },
                  { value: 'LIVRÉE', label: 'Livrée' },
                  { value: 'ANNULÉE', label: 'Annulée' }
                ]}
              />
            </div>

            {/* WhatsApp Follow-up */}
            <div>
              <p className="text-sm text-brand-text-muted mb-3">Message de suivi WhatsApp</p>
              <div className="p-3 bg-brand-bg-alt rounded-lg border border-brand-gold/10">
                <p className="text-sm text-brand-text mb-3">
                  {getWhatsAppFollowupMessage(selectedOrder)}
                </p>
                <div className="flex gap-2">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(getWhatsAppFollowupMessage(selectedOrder))}
                  >
                    <Copy size={14} />
                    Copier
                  </AdminButton>
                  <AdminButton
                    variant="success"
                    size="sm"
                    onClick={() => openWhatsApp(selectedOrder.client_phone, getWhatsAppFollowupMessage(selectedOrder))}
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </AdminButton>
                </div>
              </div>
            </div>

            {/* History */}
            {selectedOrder.history && selectedOrder.history.length > 0 && (
              <div>
                <p className="text-sm text-brand-text-muted mb-3">Historique</p>
                <div className="space-y-2">
                  {selectedOrder.history.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <span className="text-brand-text-muted">
                        {new Date(entry.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <AdminBadge variant={getStatusBadgeVariant(entry.status)}>
                        {entry.status}
                      </AdminBadge>
                      {entry.note && (
                        <span className="text-brand-text-muted">— {entry.note}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
};
