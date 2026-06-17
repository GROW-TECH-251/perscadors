// src/app/admin/clients/page.tsx
// ============================================
// Gestion des Clients
// ============================================

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminModal, AdminInput, AdminTextarea, AdminBadge } from '@/admin/components';
import { Users, Phone, MapPin, Tag, MessageCircle, Copy, Download, Eye, Save } from 'lucide-react';
import { fetchCustomerSummaries, upsertCustomerMeta } from '@/services/customerService';
import { fetchOrdersByPhone } from '@/services/orderService';
import { exportCustomersToCsv } from '@/utils/exportCsv';
import type { CustomerSummary, CustomerSegment, AdminOrder } from '@/admin/types';

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

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerSummaries();
      setCustomers(data);
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
      alert('Copié !');
    } catch (error: unknown) {
      console.error('Erreur copie:', error);
    }
  };

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
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
        alert(result.error);
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

      alert('Fiche client mise à jour !');
    } catch (error: unknown) {
      console.error('Erreur sauvegarde fiche client:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSavingMeta(false);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Clients</h1>
          <p className="text-brand-text-muted mt-1">{customers.length} clients</p>
        </div>
        <div className="flex gap-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <AdminCard key={customer.phone}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bebas text-xl text-brand-text uppercase">{customer.name}</h3>
                  <p className="text-sm text-brand-text-muted">{customer.phone}</p>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {customer.segments.slice(0, 2).map((segment) => (
                    <span
                      key={segment}
                      className={`px-2 py-0.5 text-xs font-medium rounded ${getSegmentBadgeColor(segment)}`}
                    >
                      {segment}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                  <MapPin size={14} />
                  <span>{customer.area}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                  <Phone size={14} />
                  <span>{customer.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <p className="text-brand-text-muted">Commandes</p>
                  <p className="font-bold text-brand-text">{customer.orderCount}</p>
                </div>
                <div>
                  <p className="text-brand-text-muted">Total dépensé</p>
                  <p className="font-bold text-brand-gold">{customer.totalSpent.toLocaleString()} FCFA</p>
                </div>
              </div>

              <div className="pt-3 border-t border-brand-gold/10 mb-4">
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
                      className="px-2 py-0.5 bg-brand-bg-alt text-brand-text text-xs rounded flex items-center gap-1"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const message = `Bonjour ${customer.name}, merci pour votre confiance chez HP Collection ! Découvrez nos nouvelles arrivées cette semaine. 🛍️`;
                    copyToClipboard(message);
                  }}
                >
                  <Copy size={14} />
                  Copier message
                </AdminButton>
                <AdminButton
                  variant="success"
                  size="sm"
                  onClick={() => {
                    const message = `Bonjour ${customer.name}, merci pour votre confiance chez HP Collection ! Découvrez nos nouvelles arrivées cette semaine. 🛍️`;
                    openWhatsApp(customer.phone, message);
                  }}
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </AdminButton>
                <AdminButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenCustomerDetails(customer)}
                >
                  <Eye size={14} />
                  Détails
                </AdminButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-brand-text-muted mb-2">Segments</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.segments.map((segment) => (
                    <span key={segment} className={`px-2 py-1 text-xs font-medium rounded ${getSegmentBadgeColor(segment)}`}>
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