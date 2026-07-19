// src/app/admin/commandes/page.tsx
// ============================================
// Gestion des Commandes (Levier 4 : Effet IKEA, Expédition Personnalisée, Purge Annulation & RECOVERY MATRIX)
// ============================================

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminBadge, AdminModal, AdminSelect, AdminTextarea } from '@/admin/components';
import { ShoppingCart, Eye, MessageCircle, Copy, Download, ClipboardList, Truck, BadgeInfo, FileText, Send, Zap, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { buildWhatsAppOrderMessage, fetchAdminOrders, updateOrderStatus, deleteOrder, createOrderFromCart, syncPendingOrders } from '@/services/orderService';
import { fetchShopSettings, formatWhatsAppMessage, getDefaultShopSettings } from '@/services/settingsService';
import { exportOrdersToCsv } from '@/utils/exportCsv';
import type { AdminOrder, OrderStatus, ShopSettings } from '@/admin/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState<OrderStatus>('EN ATTENTE');
  const [statusNote, setStatusNote] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<number | null>(null);
  const [isSyncingPending, setIsSyncingPending] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');

  // ============================================
  // PRIORITÉ 2 : RECOVERY MATRIX (Rattrapage WhatsApp)
  // ============================================
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryText, setRecoveryText] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, shopSettings] = await Promise.all([
        fetchAdminOrders(),
        fetchShopSettings()
      ]);
      setOrders(ordersData);
      if (shopSettings) {
        setSettings(shopSettings);
      }
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

  const handlePendingOrdersSync = async () => {
    setIsSyncingPending(true);
    setSyncFeedback('');

    try {
      const result = await syncPendingOrders();
      await loadOrders();

      if (result.error) {
        setSyncFeedback(result.error);
      } else if (result.syncedCount > 0) {
        setSyncFeedback(`${result.syncedCount} commande${result.syncedCount > 1 ? 's' : ''} synchronisée${result.syncedCount > 1 ? 's' : ''}.`);
      } else {
        setSyncFeedback('Aucune commande en attente de synchronisation.');
      }
    } catch (error: unknown) {
      console.error('Erreur de synchronisation des commandes en attente:', error);
      setSyncFeedback('La synchronisation est indisponible pour le moment.');
    } finally {
      setIsSyncingPending(false);
    }
  };

  // ============================================
  // LEVIER 2 & 4 : GESTION LOGISTIQUE ÉCLAIR (Effet IKEA & Purge Annulation)
  // ============================================

  // 1. Changement d'état instantané en 1 clic (Quick Status Toggle)
  const handleQuickStatusChange = async (id: number, newStatus: OrderStatus) => {
    // CORRECTION CADRE FINAL : Si la commande devient ANNULÉE, proposer la suppression directe !
    if (newStatus === 'ANNULÉE') {
      const shouldDelete = window.confirm('Cette commande est marquée comme ANNULÉE. Voulez-vous supprimer définitivement cette commande et purger son historique pour ne pas encombrer le dashboard ?');
      if (shouldDelete) {
        setSavingOrderId(id);
        try {
          await deleteOrder(id);
          await loadOrders();
          if (selectedOrder?.id === id) {
            setSelectedOrder(null);
            setIsModalOpen(false);
          }
          alert('Commande annulée et supprimée avec succès !');
        } catch (error: unknown) {
          console.error('Erreur suppression commande:', error);
          alert('Une erreur est survenue lors de la suppression.');
        } finally {
          setSavingOrderId(null);
        }
        return;
      }
    }

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
      alert('Une erreur est survenue. Contactez votre administrateur.');
      await loadOrders(); // Rollback en cas d'erreur
    } finally {
      setSavingOrderId(null);
    }
  };

  // 2. Bouton "Expédier via WhatsApp" (Dispatch to Driver personnalisé)
  const handleDispatchToDriver = (order: AdminOrder) => {
    const itemsText = order.items.map(item => `• ${item.name} (Taille ${item.size}, ${item.color}) x${item.quantity}`).join('\n');
    
    const message = formatWhatsAppMessage(settings.driver_dispatch_template, {
      shopName: settings.shop_name,
      orderId: order.order_number,
      clientName: order.client_name,
      clientPhone: order.client_phone,
      clientArea: order.client_area,
      itemsList: itemsText,
      orderTotal: order.total.toLocaleString() + ' FCFA'
    });

    const encodedMessage = encodeURIComponent(message);
    const targetPhone = settings.driver_phone ? settings.driver_phone.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${targetPhone}?text=${encodedMessage}`, '_blank');
  };

  // 3. Génération et copie instantanée du bordereau livreur (Delivery Slip Copy)
  const handleCopyDeliverySlip = async (order: AdminOrder) => {
    const slip =
      `=== BORDEREAU DE LIVRAISON ${settings.shop_name.toUpperCase()} ===\n` +
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
      alert('Une erreur est survenue lors de la copie du bordereau');
    }
  };

  const handleStatusChange = async () => {
    if (!selectedOrder) {
      return;
    }

    if (statusDraft === 'ANNULÉE') {
      const shouldDelete = window.confirm('Cette commande est marquée comme ANNULÉE. Voulez-vous supprimer définitivement cette commande et purger son historique pour ne pas encombrer le dashboard ?');
      if (shouldDelete) {
        setIsSavingStatus(true);
        try {
          await deleteOrder(selectedOrder.id);
          await loadOrders();
          setSelectedOrder(null);
          setIsModalOpen(false);
          alert('Commande annulée et supprimée avec succès !');
        } catch (error: unknown) {
          console.error('Erreur suppression commande modale:', error);
          alert('Une erreur est survenue lors de la suppression.');
        } finally {
          setIsSavingStatus(false);
        }
        return;
      }
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
      alert('Une erreur est survenue. Contactez votre administrateur.');
    } finally {
      setIsSavingStatus(false);
    }
  };

  // ============================================
  // PRIORITÉ 2 : SOUMISSION RECOVERY MATRIX
  // ============================================
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryText.trim()) {
      setRecoveryError('Veuillez coller le texte brut du message WhatsApp de la commande.');
      return;
    }

    setIsRecovering(true);
    setRecoveryError('');
    setRecoverySuccess('');

    try {
      const text = recoveryText;

      // Extraction intelligente (RegEx robustes tolérant le formatage WhatsApp *, _, etc.)
      const orderMatch = text.match(/COMMANDE\s*#?([A-Z0-9-]+)/i) || text.match(/R[ée]f[ée]rence\s*[\u003a\u002d]?\s*\*?([A-Z0-9-]+)/i);
      const clientMatch = text.match(/Client\s*[\u003a\u002d]?\s*\*?([^\n]+)/i);
      const phoneMatch = text.match(/T[ée]l[ée]phone\s*[\u003a\u002d]?\s*\*?([^\n]+)/i) || text.match(/WhatsApp\s*[\u003a\u002d]?\s*\*?([^\n]+)/i);
      const areaMatch = text.match(/Zone\s*[\u003a\u002d]?\s*\*?([^\n]+)/i);
      const totalMatch = text.match(/TOTAL\s*[\u003a\u002d]?\s*\*?([0-9.,\s]+)/i);

      const order_number = orderMatch ? orderMatch[1].replace(/\*/g, '').trim() : `HP-REC-${Date.now().toString().slice(-4)}`;
      const client_name = clientMatch ? clientMatch[1].replace(/\*/g, '').trim() : 'Client WhatsApp Inconnu';
      const client_phone = phoneMatch ? phoneMatch[1].replace(/\*/g, '').replace(/\D/g, '').trim() : '22900000000';
      const client_area = areaMatch ? areaMatch[1].replace(/\*/g, '').trim() : 'Cotonou (Par Défaut)';
      
      const rawTotal = totalMatch ? Number(totalMatch[1].replace(/[^0-9]/g, '')) : 25000;

      // Extraction des articles
      const items: { name: string; price: number; quantity: number; size: string; color: string; image: string }[] = [];
      const itemRegex = /(?:\u2022|\*?\d+\.)\s*\*?([^\n*]+)\*?\s*\n\s*(?:Taille\s*:\s*([^|]+?)\s*\|\s*Couleur\s*:\s*([^\n]+)|Taille\s*:\s*([^\n]+)\s*\n\s*Couleur\s*:\s*([^\n]+))/gi;
      
      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const name = match[1]?.trim() || 'Article HP Collection';
        const size = (match[2] || match[4] || 'M').trim();
        const color = (match[3] || match[5] || 'Standard').trim();
        items.push({
          name,
          price: Math.round(rawTotal / (items.length + 1)),
          quantity: 1,
          size,
          color,
          image: '/images/LOGOSITE/logo.png'
        });
      }

      if (items.length === 0) {
        items.push({
          name: 'Commande Spéciale WhatsApp',
          price: rawTotal,
          quantity: 1,
          size: 'Standard',
          color: 'Standard',
          image: '/images/LOGOSITE/logo.png'
        });
      }

      const payload = {
        order_number,
        client_name,
        client_phone,
        client_area,
        items,
        subtotal: rawTotal,
        delivery_fee: 0,
        total: rawTotal
      };

      await createOrderFromCart(payload);
      await loadOrders();

      setRecoverySuccess(`🎉 Commande #${order_number} (${client_name}) re-créée et synchronisée avec succès en base de données et dans la liste des clients !`);
      setRecoveryText('');
      setTimeout(() => {
        setIsRecoveryModalOpen(false);
        setRecoverySuccess('');
      }, 3000);
    } catch (err: unknown) {
      console.error('Erreur Recovery Matrix:', err);
      setRecoveryError('Une erreur est survenue lors de la synchronisation. Contactez votre administrateur.');
    } finally {
      setIsRecovering(false);
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

  const pendingSyncCount = orders.filter((order) => order.sync_status !== 'synced').length;
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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between border-b border-brand-gold/10 pb-6">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold border border-brand-gold/20 shadow-sm">
            Pilotage Logistique • Vitesse WhatsApp
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Gestion des Commandes</h1>
          <p className="text-brand-text-muted mt-1">{orders.length} commandes enregistrées</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <AdminButton
            variant="primary"
            onClick={() => setIsRecoveryModalOpen(true)}
            className="bg-amber-500 text-[#0A0A0A] hover:bg-amber-400 font-bebas uppercase tracking-wider shadow-lg flex items-center gap-2 border border-amber-300/30"
          >
            <Zap size={18} className="fill-current animate-pulse" />
            ⚡ Recovery Matrix (Rattrapage WhatsApp)
          </AdminButton>
          <AdminButton
            variant="secondary"
            onClick={handlePendingOrdersSync}
            loading={isSyncingPending}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isSyncingPending ? 'animate-spin' : ''} />
            Réessayer la synchronisation{pendingSyncCount > 0 ? ` (${pendingSyncCount})` : ''}
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => exportOrdersToCsv(orders)}>
            <Download size={16} />
            Exporter CSV
          </AdminButton>
        </div>
      </div>

      {syncFeedback && (
        <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-3 text-sm text-brand-text flex items-center gap-2">
          <RefreshCw size={16} className="text-brand-gold" />
          <p>{syncFeedback}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <AdminSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher par référence, client ou téléphone..."
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'EN ATTENTE', label: 'En attente' },
            { id: 'CONFIRMÉE', label: 'Confirmées' },
            { id: 'EN LIVRAISON', label: 'En livraison' },
            { id: 'LIVRÉE', label: 'Livrées' },
            { id: 'ANNULÉE', label: 'Annulées' }
          ].map((status) => (
            <button
              key={status.id}
              type="button"
              onClick={() => setStatusFilter(status.id as typeof statusFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                statusFilter === status.id
                  ? 'bg-brand-gold text-[#0A0A0A]'
                  : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <AdminEmptyState
          icon={<ShoppingCart size={48} />}
          title="Aucune commande trouvée"
          description="Il n'y a aucune commande correspondant à tes critères de recherche."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredOrders.map((order, index) => {
            const isSavingOrderStatus = savingOrderId === order.id;
            const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <AdminCard key={`order-${order.id}-${index}`} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bebas text-lg tracking-wider text-brand-text uppercase truncate max-w-full">
                        {order.order_number}
                      </h3>
                    </div>
                    <p className="text-sm font-medium text-brand-text mt-1 truncate">{order.client_name}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5 truncate">
                      {order.client_phone} • {order.client_area}
                    </p>
                    {order.sync_status !== 'synced' && (
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                        En attente de synchronisation
                      </p>
                    )}
                  </div>
                  <AdminBadge
                    variant={
                      order.status === 'LIVRÉE' ? 'success' :
                      order.status === 'EN ATTENTE' ? 'warning' :
                      order.status === 'ANNULÉE' ? 'danger' : 'info'
                    }
                  >
                    {order.status}
                  </AdminBadge>
                </div>

                <div className="grid grid-cols-2 gap-3 py-2 border-y border-brand-gold/10">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-brand-text-muted mb-1">Articles</p>
                    <p className="font-bebas text-2xl text-brand-text">{itemsCount} pièce(s)</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-brand-text-muted mb-1">Total</p>
                    <p className="font-bebas text-2xl text-brand-gold font-bold">
                      {order.total.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>

                {/* Levier 2 & 4 : Gestion Logistique Éclair en 1 clic */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-text-muted block">
                    Action Rapide : Changer Statut
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {(['EN ATTENTE', 'CONFIRMÉE', 'EN LIVRAISON', 'LIVRÉE', 'ANNULÉE'] as OrderStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleQuickStatusChange(order.id, st)}
                        disabled={isSavingOrderStatus || order.status === st}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bebas tracking-wider uppercase transition-all cursor-pointer disabled:cursor-default ${
                          order.status === st
                            ? 'bg-brand-gold text-[#0A0A0A] shadow-md font-bold'
                            : 'bg-brand-bg border border-brand-gold/20 hover:border-brand-gold/50 text-brand-text-muted hover:text-brand-text'
                        }`}
                      >
                        {st === 'EN ATTENTE' ? 'Attente' : st === 'EN LIVRAISON' ? 'Livraison' : st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expédition Livreur & Copie Bordereau */}
                <div className="pt-2 border-t border-brand-gold/10 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setStatusDraft(order.status);
                        setIsModalOpen(true);
                      }}
                    >
                      <Eye size={14} />
                      Détails
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyDeliverySlip(order)}
                    >
                      <Copy size={14} />
                      Bordereau
                    </AdminButton>
                  </div>
                  <AdminButton
                    variant="success"
                    size="sm"
                    onClick={() => handleDispatchToDriver(order)}
                  >
                    <Truck size={14} />
                    Mission Livreur
                  </AdminButton>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {/* MODALE D'APERÇU & STATUTS DETAILED */}
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
            {/* Header info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-brand-bg rounded-xl border border-brand-gold/10">
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Client</p>
                <p className="font-medium text-brand-text">{selectedOrder.client_name}</p>
                <p className="text-sm text-brand-text-muted mt-0.5">WhatsApp: {selectedOrder.client_phone}</p>
                <p className="text-sm text-brand-text-muted">Zone: {selectedOrder.client_area}</p>
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
                  <Truck size={18} /> Mission Livreur (Personnalisée)
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

      {/* PRIORITÉ 2 : MODALE RECOVERY MATRIX (Rattrapage WhatsApp) */}
      <AdminModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        title="⚡ Recovery Matrix — Re-synchronisation Express WhatsApp"
      >
        <form onSubmit={handleRecoverySubmit} className="space-y-6">
          {recoverySuccess && (
            <div className="p-4 bg-emerald-950/90 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-medium flex items-center gap-3 backdrop-blur-sm animate-slide-up-fade">
              <CheckCircle2 size={24} className="flex-shrink-0" />
              <p>{recoverySuccess}</p>
            </div>
          )}
          {recoveryError && (
            <div className="p-4 bg-red-950/90 border border-red-500/30 rounded-2xl text-red-400 text-sm font-medium flex items-center gap-3 backdrop-blur-sm animate-slide-up-fade">
              <AlertCircle size={24} className="flex-shrink-0" />
              <p>{recoveryError}</p>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-sm text-brand-text-muted space-y-1">
            <p className="font-bebas text-lg text-amber-500 uppercase tracking-wider">Objectif Métier : Zéro Perte de Données</p>
            <p>Si une commande passée par un client sur la vitrine n&apos;est pas apparue ici (coupure réseau, erreur Supabase), copiez simplement le message reçu sur votre WhatsApp et collez-le ci-dessous. Le système recréera et synchronisera la commande instantanément !</p>
          </div>

          <AdminTextarea
            label="Texte Brut du Message WhatsApp"
            value={recoveryText}
            onChange={setRecoveryText}
            rows={10}
            placeholder={`Collez le message ici. Exemple :
👑 *HP COLLECTION — COMMANDE #HP-20260629-ABCD*
👤 *Client :* Poyor Poyor
📍 *Zone :* Cotonou VIP
...
*1. Basket Streetwear Classic Black & White*
   📏 Taille : 42 | 🎨 Couleur : Noir | 🔢 Qté : 1
   💰 22,000 FCFA
...
✅ *TOTAL : 22,000 FCFA*`}
            required
          />

          <div className="flex gap-3 pt-4 border-t border-brand-gold/15">
            <AdminButton type="submit" variant="primary" loading={isRecovering} className="flex-1 shadow-lg bg-amber-500 text-[#0A0A0A] hover:bg-amber-400">
              {isRecovering ? 'Analyse et Synchronisation...' : 'Générer et Synchroniser la Commande'}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => setIsRecoveryModalOpen(false)} disabled={isRecovering}>
              Fermer
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
