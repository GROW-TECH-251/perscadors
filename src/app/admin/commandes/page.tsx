// src/app/admin/commandes/page.tsx
// ============================================
// Gestion des Commandes (Levier 2 : Gestion Logistique Éclair)
// ============================================

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminBadge, AdminModal, AdminSelect, AdminTextarea } from '@/admin/components';
import { ShoppingCart, Eye, MessageCircle, Copy, Download, ClipboardList, Truck, BadgeInfo, FileText, Send } from 'lucide-react';
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
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);

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

  // ============================================
  // LEVIER 2 : GESTION LOGISTIQUE ÉCLAIR (Vitesse WhatsApp)
  // ============================================

  // 1. Changement d'état instantané en 1 clic (Quick Status Toggle)
  const handleQuickStatusChange = async (id: number, newStatus: OrderStatus) => {
    setSavingOrderId(id);
    try {
      // Mise à jour optimiste locale pour une réactivité instantanée à l'écran
      setOrders((currentOrders) =>
        currentOrders.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
        setStatusDraft(newStatus);
      }

      await updateOrderStatus(id, newStatus, `Statut mis à jour rapidement vers ${newStatus}`);
    } catch (error: unknown) {
      console.error('Erreur mise à jour rapide statut:', error);
      alert('Erreur lors de la mise à jour du statut');
      await loadOrders(); // Rollback en cas d'erreur
    } finally {
      setSavingOrderId(null);
    }
  };

  // 2. Bouton "Expédier via WhatsApp" (Dispatch to Driver)
  const handleDispatchToDriver = (order: AdminOrder) => {
    const message =
      `🚀 *MISSION LIVRAISON HP COLLECTION* 🚀\n\n` +
      `📦 *Réf Commande :* ${order.order_number}\n` +
      `👤 *Client :* ${order.client_name}\n` +
      `📱 *Contact :* ${order.client_phone}\n` +
      `📍 *Lieu de livraison :* ${order.client_area}\n\n` +
      `🛒 *Articles à remettre au client :*\n` +
      `${order.items.map(item => `• ${item.name} (Taille ${item.size}, ${item.color}) x${item.quantity}`).join('\n')}\n\n` +
      `💰 *Montant net à encaisser :* ${order.total.toLocaleString()} FCFA\n\n` +
      `_Merci de confirmer la bonne réception de cette mission et d'entamer la livraison._`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  // 3. Génération et copie instantanée du bordereau livreur (Delivery Slip Copy)
  const handleCopyDeliverySlip = async (order: AdminOrder) => {
    const slip =
      `=== BORDEREAU DE LIVRAISON HP COLLECTION ===\n` +
      `RÉFÉRENCE : ${order.order_number}\n` +
      `CLIENT : ${order.client_name}\n` +
      `TÉLÉPHONE : ${order.client_phone}\n` +
      `ZONE : ${order.client_area}\n\n` +
      `ARTICLES :\n` +
      `${order.items.map(item => `- ${item.name} | Taille: ${item.size} | Couleur: ${item.color} | Qté: ${item.quantity}`).join('\n')}\n\n` +
      `MONTANT À ENCAISSER : ${order.total.toLocaleString()} FCFA\n` +
      `==========================================`;

    try {
      await navigator.clipboard.writeText(slip);
      alert('Bordereau livreur copié dans le presse-papier !');
    } catch (error: unknown) {
      console.error('Erreur copie bordereau:', error);
      alert('Erreur lors de la copie du bordereau');
    }
  };

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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold border border-brand-gold/20">
            Gestion Logistique Éclair
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Commandes</h1>
          <p className="text-brand-text-muted mt-1">{orders.length} commandes enregistrées</p>
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
        <AdminCard className="p-0 overflow-hidden shadow-xl border-brand-gold/15">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-bg-alt border-b border-brand-gold/20">
                <tr>
                  <th className="py-4 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">Référence</th>
                  <th className="py-4 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">Client</th>
                  <th className="py-4 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">Zone</th>
                  <th className="py-4 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">Total</th>
                  <th className="py-4 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">Statut (Clic pour changer)</th>
                  <th className="py-4 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">Logistique Éclair</th>
                  <th className="py-4 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gold/10">
                {filteredOrders.map((order) => {
                  const isSaving = savingOrderId === order.id;
                  return (
                    <tr key={order.id} className="hover:bg-brand-gold/5 transition-colors">
                      <td className="py-4 px-4 text-sm font-mono font-semibold text-brand-text">{order.order_number}</td>
                      <td className="py-4 px-4 text-sm">
                        <p className="font-medium text-brand-text">{order.client_name}</p>
                        <p className="text-xs text-brand-text-muted font-mono mt-0.5">{order.client_phone}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-brand-text-muted">{order.client_area}</td>
                      <td className="py-4 px-4 text-sm font-bold text-brand-gold">{order.total.toLocaleString()} FCFA</td>
                      
                      {/* Levier 2 : Pilules de Statut en 1 Clic (Quick Status Toggles) */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(['EN ATTENTE', 'CONFIRMÉE', 'EN LIVRAISON', 'LIVRÉE', 'ANNULÉE'] as OrderStatus[]).map((st) => {
                            const isActive = order.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleQuickStatusChange(order.id, st)}
                                disabled={isSaving}
                                className={`px-2.5 py-1 text-[11px] font-bebas uppercase tracking-wider rounded-lg border transition-all duration-200 active:scale-95 cursor-pointer ${
                                  isActive
                                    ? st === 'LIVRÉE' ? 'bg-emerald-500 text-[#0A0A0A] border-emerald-400 font-bold shadow' :
                                      st === 'EN ATTENTE' ? 'bg-amber-500 text-[#0A0A0A] border-amber-400 font-bold shadow' :
                                      st === 'ANNULÉE' ? 'bg-red-600 text-white border-red-500 font-bold shadow' :
                                      'bg-blue-500 text-[#0A0A0A] border-blue-400 font-bold shadow'
                                    : 'bg-brand-bg text-brand-text-muted border-brand-gold/10 hover:border-brand-gold/40 hover:text-brand-text'
                                }`}
                                title={`Basculer en ${st}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Levier 2 : Actions Logistiques Instantanées */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDispatchToDriver(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bebas uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                            title="Expédier l'ordre au livreur via WhatsApp"
                          >
                            <Truck size={14} /> Expédier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyDeliverySlip(order)}
                            className="p-1.5 bg-brand-bg-alt border border-brand-gold/20 hover:border-brand-gold text-brand-text-muted hover:text-brand-gold rounded-xl transition-all active:scale-95 cursor-pointer"
                            title="Copier le bordereau livreur"
                            aria-label="Copier bordereau"
                          >
                            <FileText size={16} />
                          </button>
                        </div>
                      </td>

                      {/* Actions Vue Complète */}
                      <td className="py-4 px-4">
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {/* Order Detail Modal */}
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
            {/* Infos rapides */}
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

            {/* Encarts financiers */}
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

            {/* Boutons d'expédition livreur en modale */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
              <div>
                <h4 className="font-bebas text-lg text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Truck size={18} /> Mission Livreur
                </h4>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Générez un ordre de livraison WhatsApp ou copiez le bordereau propre.
                </p>
              </div>
              <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleCopyDeliverySlip(selectedOrder)}
                  className="px-4 py-2 bg-brand-bg border border-brand-gold/20 hover:border-brand-gold text-brand-text-muted hover:text-brand-gold text-xs font-bebas uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <FileText size={14} /> Copier Bordereau
                </button>
                <button
                  type="button"
                  onClick={() => handleDispatchToDriver(selectedOrder)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bebas uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={14} /> Expédier via WhatsApp
                </button>
              </div>
            </div>

            {/* Articles */}
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

            {/* Totals */}
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

            {/* Changement statut modale */}
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

            {/* Suivi WhatsApp Client */}
            <div>
              <p className="text-sm text-brand-text-muted mb-3">Message de suivi WhatsApp Client</p>
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

            {/* Historique */}
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
