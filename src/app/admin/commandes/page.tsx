// src/app/admin/commandes/page.tsx
// ============================================
// Gestion des Commandes
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminBadge, AdminModal, AdminSelect } from '@/admin/components';
import { ShoppingCart, Eye, MessageCircle, Copy, Download } from 'lucide-react';
import { fetchAdminOrders, updateOrderStatus } from '@/services/orderService';
import { exportOrdersToCsv } from '@/utils/exportCsv';
import type { AdminOrder, OrderStatus } from '@/admin/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch (error: unknown) {
      console.error('Erreur chargement commandes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadOrders();
    };
    init();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.error) {
        alert(result.error);
        return;
      }

      await loadOrders();

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error: unknown) {
      console.error('Erreur mise à jour commande:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Message copié !');
    } catch (error: unknown) {
      console.error('Erreur copie:', error);
    }
  };

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const getWhatsAppMessage = (order: AdminOrder) => {
    const templates: Record<OrderStatus, string> = {
      'EN ATTENTE': `Bonjour ${order.client_name}, votre commande ${order.order_number} est en attente de validation.`,
      'CONFIRMÉE': `Bonjour ${order.client_name}, votre commande ${order.order_number} est confirmée. Nous vous contactons pour la livraison.`,
      'EN LIVRAISON': `Bonjour ${order.client_name}, votre commande ${order.order_number} est en cours de livraison.`,
      'LIVRÉE': `Bonjour ${order.client_name}, votre commande ${order.order_number} a été livrée. Merci pour votre confiance !`,
      'ANNULÉE': `Bonjour ${order.client_name}, votre commande ${order.order_number} a été annulée.`
    };

    return templates[order.status] || '';
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.client_phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Commandes</h1>
          <p className="text-brand-text-muted mt-1">{orders.length} commandes</p>
        </div>
        <div className="flex gap-3">
          <AdminButton variant="secondary" onClick={() => window.history.back()}>Retour</AdminButton>
          <AdminButton variant="secondary" onClick={() => exportOrdersToCsv(orders)}>
            <Download size={18} />
            Export CSV
          </AdminButton>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <AdminSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher (réf, client, téléphone)..."
          className="flex-1"
        />
        <AdminSelect
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
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

      {filteredOrders.length === 0 ? (
        <AdminEmptyState icon={<ShoppingCart size={48} />} title="Aucune commande" />
      ) : (
        <AdminCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-bg-alt">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase">Référence</th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase">Téléphone</th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-brand-gold/10 hover:bg-brand-gold/5 transition-colors">
                    <td className="py-3 px-4 text-sm font-mono">{order.order_number}</td>
                    <td className="py-3 px-4 text-sm">{order.client_name}</td>
                    <td className="py-3 px-4 text-sm">{order.client_phone}</td>
                    <td className="py-3 px-4 text-sm font-bold text-brand-gold">{order.total.toLocaleString()} FCFA</td>
                    <td className="py-3 px-4">
                      <AdminBadge
                        variant={
                          order.status === 'LIVRÉE' ? 'success' :
                          order.status === 'EN ATTENTE' ? 'warning' :
                          order.status === 'ANNULÉE' ? 'danger' : 'info'
                        }
                      >
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
                    <td className="py-3 px-4">
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsModalOpen(true);
                        }}
                      >
                        <Eye size={14} />
                        Voir
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {selectedOrder && (
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          title={`Commande ${selectedOrder.order_number}`}
        >
          <div className="space-y-6">
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

            <div>
              <p className="text-sm text-brand-text-muted mb-3">Articles</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between p-3 bg-brand-bg-alt rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium text-brand-text">{item.name}</p>
                        <p className="text-xs text-brand-text-muted">
                          Taille: {item.size} | Couleur: {item.color} | Qté: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-brand-gold">
                      {(item.price * item.quantity).toLocaleString()} FCFA
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-brand-gold/20 pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-brand-text">Total</span>
                <span className="text-brand-gold">{selectedOrder.total.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-brand-text-muted mb-3">Changer le statut</p>
              <AdminSelect
                value={selectedOrder.status}
                onChange={(value) => handleStatusChange(selectedOrder.id, value as OrderStatus)}
                options={[
                  { value: 'EN ATTENTE', label: 'En attente' },
                  { value: 'CONFIRMÉE', label: 'Confirmée' },
                  { value: 'EN LIVRAISON', label: 'En livraison' },
                  { value: 'LIVRÉE', label: 'Livrée' },
                  { value: 'ANNULÉE', label: 'Annulée' }
                ]}
              />
            </div>

            <div>
              <p className="text-sm text-brand-text-muted mb-3">Message de suivi WhatsApp</p>
              <div className="p-3 bg-brand-bg-alt rounded-lg border border-brand-gold/10">
                <p className="text-sm text-brand-text mb-3">
                  {getWhatsAppMessage(selectedOrder)}
                </p>
                <div className="flex gap-2">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(getWhatsAppMessage(selectedOrder))}
                  >
                    <Copy size={14} />
                    Copier
                  </AdminButton>
                  <AdminButton
                    variant="success"
                    size="sm"
                    onClick={() => openWhatsApp(selectedOrder.client_phone, getWhatsAppMessage(selectedOrder))}
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </AdminButton>
                </div>
              </div>
            </div>

            {selectedOrder.history && selectedOrder.history.length > 0 && (
              <div>
                <p className="text-sm text-brand-text-muted mb-3">Historique</p>
                <div className="space-y-2">
                  {selectedOrder.history.map((entry, index) => (
                    <div key={`${entry.date}-${index}`} className="flex items-center gap-3 text-sm">
                      <span className="text-brand-text-muted">
                        {new Date(entry.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <AdminBadge
                        variant={
                          entry.status === 'LIVRÉE' ? 'success' :
                          entry.status === 'EN ATTENTE' ? 'warning' :
                          entry.status === 'ANNULÉE' ? 'danger' : 'info'
                        }
                      >
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
}