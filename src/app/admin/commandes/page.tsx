// src/app/admin/commandes/page.tsx
// ============================================
// Gestion des Commandes
// ============================================

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminBadge, AdminModal, AdminSelect, AdminTextarea } from '@/admin/components';
import { ShoppingCart, Eye, MessageCircle, Copy, Download, ClipboardList, Truck, BadgeInfo } from 'lucide-react';
import { buildWhatsAppOrderMessage, fetchAdminOrders, updateOrderStatus } from '@/services/orderService';
import { exportOrdersToCsv } from '@/utils/exportCsv';
import type { AdminOrder, OrderStatus } from '@/admin/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState<OrderStatus>('EN ATTENTE');
  const [statusNote, setStatusNote] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

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


  const handleStatusChange = async () => {
    if (!selectedOrder) {
      return;
    }

    setIsSavingStatus(true);

    try {
      const result = await updateOrderStatus(
        selectedOrder.id,
        statusDraft,
        statusNote.trim() || undefined
      );

      if (result.error) {
        alert(result.error);
        return;
      }

      await loadOrders();

      if (result.data) {
        setSelectedOrder(result.data);
        setStatusDraft(result.data.status);
      }

      setStatusNote('');
    } catch (error: unknown) {
      console.error('Erreur mise à jour commande:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsSavingStatus(false);
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
    return buildWhatsAppOrderMessage({
      order_number: order.order_number,
      client_name: order.client_name,
      client_phone: order.client_phone,
      client_area: order.client_area,
      items: order.items,
      subtotal: order.subtotal ?? order.total,
      delivery_fee: order.delivery_fee ?? 0,
      total: order.total
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.client_phone.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const orderItemsCount = selectedOrder?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const orderSubtotal = selectedOrder?.subtotal ?? selectedOrder?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;
  const orderDeliveryFee = selectedOrder?.delivery_fee ?? Math.max((selectedOrder?.total || 0) - orderSubtotal, 0);

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Opérations commandes
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Commandes</h1>
          <p className="text-brand-text-muted mt-1">{orders.length} commandes</p>
        </div>
        <div className="flex flex-wrap gap-3">
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
                          setStatusDraft(order.status);
                          setStatusNote('');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Client</p>
                <p className="font-medium text-brand-text">{selectedOrder.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Téléphone</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-brand-text">{selectedOrder.client_phone}</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedOrder.client_phone)}
                    className="p-1 hover:bg-brand-gold/10 rounded cursor-pointer"
                    aria-label="Copier le numéro"
                  >
                    <Copy size={14} className="text-brand-gold" />
                  </button>
                </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-brand-gold/15 bg-brand-bg-alt p-4">
                <div className="flex items-center gap-2 text-brand-gold mb-2">
                  <ClipboardList size={16} />
                  <span className="text-xs uppercase tracking-wider">Articles</span>
                </div>
                <p className="font-bebas text-3xl text-brand-text">{orderItemsCount}</p>
              </div>
              <div className="rounded-xl border border-brand-gold/15 bg-brand-bg-alt p-4">
                <div className="flex items-center gap-2 text-brand-gold mb-2">
                  <Truck size={16} />
                  <span className="text-xs uppercase tracking-wider">Livraison</span>
                </div>
                <p className="font-bebas text-3xl text-brand-text">{orderDeliveryFee.toLocaleString()} FCFA</p>
              </div>
              <div className="rounded-xl border border-brand-gold/15 bg-brand-bg-alt p-4">
                <div className="flex items-center gap-2 text-brand-gold mb-2">
                  <BadgeInfo size={16} />
                  <span className="text-xs uppercase tracking-wider">Sous-total</span>
                </div>
                <p className="font-bebas text-3xl text-brand-text">{orderSubtotal.toLocaleString()} FCFA</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-brand-text-muted mb-3">Articles</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between p-3 bg-brand-bg-alt rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <div className="relative w-12 h-12 overflow-hidden rounded">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
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
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Sous-total</span>
                <span>{orderSubtotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Livraison</span>
                <span>{orderDeliveryFee.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-brand-text">Total</span>
                <span className="text-brand-gold">{selectedOrder.total.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminSelect
                label="Nouveau statut"
                value={statusDraft}
                onChange={(value) => setStatusDraft(value as OrderStatus)}
                options={[
                  { value: 'EN ATTENTE', label: 'En attente' },
                  { value: 'CONFIRMÉE', label: 'Confirmée' },
                  { value: 'EN LIVRAISON', label: 'En livraison' },
                  { value: 'LIVRÉE', label: 'Livrée' },
                  { value: 'ANNULÉE', label: 'Annulée' }
                ]}
              />
              <AdminTextarea
                label="Note d’historique"
                value={statusNote}
                onChange={setStatusNote}
                rows={3}
                placeholder="Ex: Client confirmé par appel, livraison prévue demain à 10h"
              />
            </div>

            <div className="flex justify-end">
              <AdminButton variant="primary" onClick={handleStatusChange} loading={isSavingStatus}>
                Enregistrer le statut
              </AdminButton>
            </div>

            <div>
              <p className="text-sm text-brand-text-muted mb-3">Message de suivi WhatsApp</p>
              <div className="p-3 bg-brand-bg-alt rounded-lg border border-brand-gold/10">
                <p className="text-sm text-brand-text mb-3 whitespace-pre-line">
                  {getWhatsAppMessage(selectedOrder)}
                </p>
                <div className="flex gap-2 flex-wrap">
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
                  {selectedOrder.history.slice().reverse().map((entry, index) => (
                    <div key={`${entry.date}-${index}`} className="flex items-start gap-3 text-sm p-3 bg-brand-bg-alt rounded-lg">
                      <span className="text-brand-text-muted min-w-[120px]">
                        {new Date(entry.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
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