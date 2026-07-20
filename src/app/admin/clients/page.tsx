// src/app/admin/clients/page.tsx
// ============================================
// Gestion des Clients (Levier 4 : Relance Magique VIP 50k & Suppression Client)
// ============================================

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminModal, AdminInput, AdminTextarea, AdminBadge, AdminToast } from '@/admin/components';
import { Users, Phone, MapPin, Tag, MessageCircle, Copy, Download, Eye, Save, Zap, Trash2 } from 'lucide-react';
import { fetchCustomerSummaries, upsertCustomerMeta, deleteCustomer } from '@/services/customerService';
import { fetchOrdersByPhone } from '@/services/orderService';
import { fetchShopSettings, formatWhatsAppMessage, getDefaultShopSettings } from '@/services/settingsService';
import { exportCustomersToCsv } from '@/utils/exportCsv';
import type { CustomerSummary, CustomerSegment, AdminOrder, ShopSettings } from '@/admin/types';

function getSegmentBadgeColor(segment: CustomerSegment) {
  switch (segment) {
    case 'VIP':
      return 'bg-purple-100 text-purple-700';
    case 'Fidèle':
      return 'bg-blue-100 text-blue-700';
    case 'Nouveau':
      return 'bg-green-100 text-green-700';
    case 'Gros panier':
      return 'bg-orange-100 text-orange-700';
    case 'À relancer':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getOrderStatusBadgeVariant(status: AdminOrder['status']): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'LIVRÉE':
      return 'success';
    case 'EN ATTENTE':
      return 'warning';
    case 'ANNULÉE':
      return 'danger';
    default:
      return 'info';
  }
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | 'all'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [customerOrders, setCustomerOrders] = useState<AdminOrder[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [tagsDraft, setTagsDraft] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const [customersData, shopSettings] = await Promise.all([
        fetchCustomerSummaries(),
        fetchShopSettings()
      ]);
      setCustomers(customersData);
      if (shopSettings) {
        setSettings(shopSettings);
      }
    } catch (error: unknown) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadCustomers();
    };
    init();
  }, [loadCustomers]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: 'Copié dans le presse-papier.', variant: 'success' });
    } catch (error: unknown) {
      console.error('Erreur copie:', error);
    }
  };

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  // ============================================
  // LEVIER 4 : SUPPRESSION CLIENT & RELANCE MAGIQUE VIP (Seuil 50k)
  // ============================================
  const handleDeleteCustomer = async (phone: string) => {
    if (!window.confirm('Voulez-vous réellement supprimer ce client du tableau de bord ? Cette action est irréversible et purgera ses commandes locales pour désencombrer l’administration.')) {
      return;
    }

    try {
      const result = await deleteCustomer(phone);
      if (result.error) {
        setToast({ message: result.error, variant: 'error' });
        return;
      }

      setCustomers((current) => current.filter((c) => c.phone !== phone));
      if (selectedCustomer?.phone === phone) {
        setDetailsOpen(false);
        setSelectedCustomer(null);
      }
      setToast({ message: 'Client supprimé avec succès.', variant: 'success' });
    } catch (error: unknown) {
      console.error('Erreur suppression client:', error);
      setToast({ message: 'Impossible de supprimer ce client pour le moment.', variant: 'error' });
    }
  };

  const handleMagicFollowup = (customer: CustomerSummary) => {
    const message = formatWhatsAppMessage(settings.vip_magic_template, {
      shopName: settings.shop_name,
      clientName: customer.name,
      couponCode: 'VIP-VIOUTOU10'
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${customer.phone}?text=${encodedMessage}`, '_blank');
  };

  const followupCustomers = customers.filter((customer) => customer.segments.includes('À relancer'));
  const vipCustomers = customers.filter((customer) => customer.segments.includes('VIP'));

  const handleSegmentCampaign = (segment: 'VIP' | 'À relancer') => {
    const targetCount = segment === 'VIP' ? vipCustomers.length : followupCustomers.length;
    const message = segment === 'VIP'
      ? formatWhatsAppMessage(settings.vip_magic_template, { shopName: settings.shop_name, clientName: 'la famille VIP', couponCode: 'VIP-VIOUTOU10' })
      : `Bonjour ! ${settings.shop_name} vous réserve de nouvelles pièces. Répondez à ce message pour connaître les disponibilités du moment.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setToast({ message: `Script de campagne prêt pour ${targetCount} client(s). Choisissez vos destinataires dans WhatsApp.`, variant: 'info' });
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.area.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSegment = segmentFilter === 'all' || customer.segments.includes(segmentFilter);
      return matchesSearch && matchesSegment;
    });
  }, [customers, searchQuery, segmentFilter]);

  const selectedCustomerAverageBasket = selectedCustomer
    ? Math.round(selectedCustomer.totalSpent / Math.max(selectedCustomer.orderCount, 1))
    : 0;

  const handleOpenCustomerDetails = async (customer: CustomerSummary) => {
    setSelectedCustomer(customer);
    setNoteDraft(customer.notes || '');
    setTagsDraft((customer.tags || []).join(', '));
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const orders = await fetchOrdersByPhone(customer.phone);
      setCustomerOrders(orders);
    } catch (error: unknown) {
      console.error('Erreur chargement historique client:', error);
      setCustomerOrders([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSaveCustomerMeta = async () => {
    if (!selectedCustomer) {
      return;
    }

    setSavingMeta(true);

    try {
      const normalizedTags = tagsDraft
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const result = await upsertCustomerMeta(selectedCustomer.phone, {
        notes: noteDraft.trim(),
        tags: normalizedTags
      });

      if (result.error) {
        setToast({ message: result.error, variant: 'error' });
        return;
      }

      const updatedCustomer: CustomerSummary = {
        ...selectedCustomer,
        notes: noteDraft.trim(),
        tags: normalizedTags
      };

      setSelectedCustomer(updatedCustomer);
      setCustomers((currentCustomers) =>
        currentCustomers.map((customer) =>
          customer.phone === updatedCustomer.phone ? updatedCustomer : customer
        )
      );

      setToast({ message: 'Fiche client mise à jour.', variant: 'success' });
    } catch (error: unknown) {
      console.error('Erreur sauvegarde fiche client:', error);
      setToast({ message: 'Impossible d’enregistrer la fiche client pour le moment.', variant: 'error' });
    } finally {
      setSavingMeta(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold border border-brand-gold/20">
            Booster de Rentabilité • VIP 50k
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Clients</h1>
          <p className="text-brand-text-muted mt-1">{customers.length} clients uniques</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
          <AdminButton
            variant="secondary"
            onClick={() => exportCustomersToCsv(customers)}
          >
            <Download size={20} />
            Export CSV
          </AdminButton>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button type="button" onClick={() => setSegmentFilter('À relancer')} className="text-left rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 transition-all hover:-translate-y-0.5 hover:border-amber-500/60"><p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Opportunité de relance</p><p className="font-bebas text-3xl text-brand-text mt-2">{followupCustomers.length}</p><p className="text-sm text-brand-text-muted mt-1">Clients à réactiver cette semaine</p><span className="inline-flex mt-3 text-xs font-semibold text-amber-600">Voir ces clients →</span></button>
        <button type="button" onClick={() => handleSegmentCampaign('VIP')} className="text-left rounded-2xl border border-brand-gold/25 bg-brand-gold/5 p-5 transition-all hover:-translate-y-0.5 hover:border-brand-gold"><p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Campagne VIP</p><p className="font-bebas text-3xl text-brand-text mt-2">{vipCustomers.length}</p><p className="text-sm text-brand-text-muted mt-1">Préparer une offre pour vos meilleurs clients</p><span className="inline-flex mt-3 text-xs font-semibold text-brand-gold">Préparer le message WhatsApp →</span></button>
      </section>

      <div className="flex flex-col sm:flex-row gap-4">
        <AdminSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher (nom, téléphone, zone)..."
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSegmentFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              segmentFilter === 'all'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setSegmentFilter('VIP')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              segmentFilter === 'VIP'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            VIP
          </button>
          <button
            onClick={() => setSegmentFilter('Fidèle')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              segmentFilter === 'Fidèle'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            Fidèles
          </button>
          <button
            onClick={() => setSegmentFilter('À relancer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              segmentFilter === 'À relancer'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            À relancer
          </button>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <AdminEmptyState icon={<Users size={48} />} title="Aucun client" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredCustomers.map((customer) => {
            // CORRECTION CADRE FINAL : Si le client a dépensé >= 50 000 FCFA, on active le bouton VIP Magique !
            const isVIP = customer.segments.includes('VIP') || customer.totalSpent >= 50000;
            return (
              <AdminCard key={customer.phone} className="relative group/client border-brand-gold/15 hover:border-brand-gold/40 transition-all shadow-md hover:shadow-xl">
                {/* BOUTON SUPPRESSION CLIENT (Poubelle Flottante) */}
                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover/client:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(customer.phone)}
                    className="p-2 bg-red-950/80 text-red-400 hover:bg-red-600 hover:text-white rounded-full shadow-lg transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-sm"
                    title="Supprimer ce client"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-start justify-between mb-4 pr-10">
                  <div>
                    <h3 className="font-bebas text-xl text-brand-text uppercase truncate max-w-full">{customer.name}</h3>
                    <p className="text-sm text-brand-text-muted font-mono mt-0.5">{customer.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {customer.segments.slice(0, 2).map((segment) => (
                      <span
                        key={segment}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg backdrop-blur-sm ${getSegmentBadgeColor(segment)}`}
                      >
                        {segment}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                    <MapPin size={14} className="text-brand-gold" />
                    <span>{customer.area}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                    <Phone size={14} className="text-brand-gold" />
                    <span>{customer.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4 bg-brand-bg p-3 rounded-xl border border-brand-gold/10">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-brand-text-muted">Commandes</p>
                    <p className="font-bebas text-2xl text-brand-text mt-0.5">{customer.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-brand-text-muted">Total dépensé</p>
                    <p className="font-bebas text-2xl text-brand-gold mt-0.5">{customer.totalSpent.toLocaleString()} FCFA</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-brand-gold/10 mb-4 space-y-1">
                  <p className="text-xs text-brand-text-muted">
                    Dernière commande : {new Date(customer.lastOrderDate).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-brand-text-muted">
                    Statut : {customer.lastOrderStatus}
                  </p>
                </div>

                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {customer.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-brand-bg text-brand-text text-xs rounded-lg border border-brand-gold/10 flex items-center gap-1.5"
                      >
                        <Tag size={12} className="text-brand-gold" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Levier 4 : Bouton de Relance Magique VIP (Seuil 50k) */}
                <div className="space-y-2 pt-2 border-t border-brand-gold/10">
                  <button
                    type="button"
                    onClick={() => {
                      if (isVIP) {
                        handleMagicFollowup(customer);
                      } else {
                        openWhatsApp(customer.phone, `Bonjour ${customer.name}, merci pour votre confiance chez HP Collection ! Découvrez nos nouvelles arrivées cette semaine. 🛍️`);
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bebas text-base uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer shadow-md ${
                      isVIP
                        ? 'bg-gradient-to-r from-brand-gold to-yellow-500 text-[#0A0A0A] font-bold shadow-[0_4px_15px_rgba(184,149,42,0.3)] hover:scale-[1.02]'
                        : 'bg-[#25D366] hover:bg-[#20BA5A] text-white'
                    }`}
                  >
                    {isVIP ? <Zap size={18} className="text-[#0A0A0A] fill-current animate-bounce" /> : <MessageCircle size={18} />}
                    <span>{isVIP ? 'Relance Magique VIP' : 'Contacter sur WhatsApp'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      className="w-full justify-center text-xs"
                      onClick={() => {
                        const message = `Bonjour ${customer.name}, merci pour votre confiance chez HP Collection ! Découvrez nos nouvelles arrivées cette semaine. 🛍️`;
                        copyToClipboard(message);
                      }}
                    >
                      <Copy size={13} />
                      Copier msg
                    </AdminButton>
                    <AdminButton
                      variant="primary"
                      size="sm"
                      className="w-full justify-center text-xs"
                      onClick={() => handleOpenCustomerDetails(customer)}
                    >
                      <Eye size={13} />
                      Détails
                    </AdminButton>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {/* Détails Modale */}
      {selectedCustomer && (
        <AdminModal
          isOpen={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedCustomer(null);
            setCustomerOrders([]);
          }}
          title={`Fiche client — ${selectedCustomer.name}`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Téléphone</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-brand-text">{selectedCustomer.phone}</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedCustomer.phone)}
                    className="p-1 hover:bg-brand-gold/10 rounded cursor-pointer"
                    aria-label="Copier le téléphone"
                  >
                    <Copy size={14} className="text-brand-gold" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Zone</p>
                <p className="font-medium text-brand-text">{selectedCustomer.area}</p>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Dernière commande</p>
                <p className="font-medium text-brand-text">{new Date(selectedCustomer.lastOrderDate).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted mb-1">Statut actuel</p>
                <AdminBadge variant={getOrderStatusBadgeVariant(selectedCustomer.lastOrderStatus)}>
                  {selectedCustomer.lastOrderStatus}
                </AdminBadge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-brand-gold/15 bg-brand-bg-alt p-4">
                <p className="text-xs uppercase tracking-wider text-brand-text-muted mb-2">Commandes</p>
                <p className="font-bebas text-3xl text-brand-text">{selectedCustomer.orderCount}</p>
              </div>
              <div className="rounded-xl border border-brand-gold/15 bg-brand-bg-alt p-4">
                <p className="text-xs uppercase tracking-wider text-brand-text-muted mb-2">Total dépensé</p>
                <p className="font-bebas text-3xl text-brand-text">{selectedCustomer.totalSpent.toLocaleString()} FCFA</p>
              </div>
              <div className="rounded-xl border border-brand-gold/15 bg-brand-bg-alt p-4">
                <p className="text-xs uppercase tracking-wider text-brand-text-muted mb-2">Panier moyen</p>
                <p className="font-bebas text-3xl text-brand-text">{selectedCustomerAverageBasket.toLocaleString()} FCFA</p>
              </div>
            </div>

            {/* Encart Levier 4 Modale */}
            <div className="p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
              <div>
                <h4 className="font-bebas text-lg text-brand-gold uppercase tracking-wider flex items-center gap-2">
                  <Zap size={18} className="text-brand-gold fill-current animate-pulse" /> Relance Magique VIP
                </h4>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Générez un message WhatsApp ultra-persuasif avec un coupon secret de -10%.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleMagicFollowup(selectedCustomer)}
                className="px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-light text-[#0A0A0A] text-xs font-bebas uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 font-bold"
              >
                <MessageCircle size={15} /> Déclencher Relance
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-brand-text-muted mb-2">Segments</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.segments.map((segment) => (
                    <span key={segment} className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getSegmentBadgeColor(segment)}`}>
                      {segment}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted mb-2">Préférences</p>
                <div className="space-y-2 text-sm text-brand-text">
                  <p>Tailles : {selectedCustomer.preferredSizes.length > 0 ? selectedCustomer.preferredSizes.join(', ') : '—'}</p>
                  <p>Couleurs : {selectedCustomer.preferredColors.length > 0 ? selectedCustomer.preferredColors.join(', ') : '—'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminTextarea
                label="Notes internes"
                value={noteDraft}
                onChange={setNoteDraft}
                rows={5}
                placeholder="Notes commerciales, préférences, infos de livraison, etc."
              />
              <AdminInput
                label="Tags (séparés par des virgules)"
                value={tagsDraft}
                onChange={setTagsDraft}
                placeholder="VIP, Livraison express, À rappeler"
              />
            </div>

            <div className="flex justify-between flex-wrap gap-3">
              <div className="flex gap-2 flex-wrap">
                <AdminButton
                  variant="secondary"
                  onClick={() => copyToClipboard(`Bonjour ${selectedCustomer.name}, merci pour votre confiance chez HP Collection ! Nous avons pensé à vous pour nos nouvelles arrivées. 🛍️`)}
                >
                  <Copy size={14} />
                  Copier message
                </AdminButton>
                <AdminButton
                  variant="success"
                  onClick={() => openWhatsApp(selectedCustomer.phone, `Bonjour ${selectedCustomer.name}, merci pour votre confiance chez HP Collection ! Nous avons pensé à vous pour nos nouvelles arrivées. 🛍️`)}
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </AdminButton>
              </div>
              <AdminButton variant="primary" onClick={handleSaveCustomerMeta} loading={savingMeta}>
                <Save size={16} />
                Enregistrer la fiche
              </AdminButton>
            </div>

            <div>
              <p className="text-sm text-brand-text-muted mb-3">Historique des commandes</p>
              {detailsLoading ? (
                <div className="p-4 bg-brand-bg-alt rounded-lg text-brand-text-muted">Chargement de l&apos;historique...</div>
              ) : customerOrders.length === 0 ? (
                <div className="p-4 bg-brand-bg-alt rounded-lg text-brand-text-muted">Aucune commande trouvée pour ce client.</div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-brand-gold/10 bg-brand-bg-alt p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p className="font-bebas text-lg text-brand-text">{order.order_number}</p>
                          <p className="text-xs text-brand-text-muted">
                            {new Date(order.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <AdminBadge variant={getOrderStatusBadgeVariant(order.status)}>
                            {order.status}
                          </AdminBadge>
                          <p className="text-sm font-bold text-brand-gold mt-2">{order.total.toLocaleString()} FCFA</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <p key={`${order.id}-${item.name}-${index}`} className="text-sm text-brand-text-muted">
                            • {item.name} — {item.quantity} × {item.price.toLocaleString()} FCFA ({item.size} / {item.color})
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
