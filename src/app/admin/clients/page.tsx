// src/app/admin/clients/page.tsx
// ============================================
// Gestion des Clients
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState } from '@/admin/components';
import { Users, Phone, MapPin, Tag, MessageCircle, Copy } from 'lucide-react';
import { fetchCustomerSummaries } from '@/services/customerService';
import { Download } from 'lucide-react';
import { exportCustomersToCsv } from '@/utils/exportCsv';
import type { CustomerSummary, CustomerSegment } from '@/admin/types';

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | 'all'>('all');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerSummaries();
      setCustomers(data);
    } catch (err: unknown) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // CORRECTION: Encapsuler dans une fonction async
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
    } catch (err: unknown) {
      console.error('Erreur copie:', err);
    }
  };

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = segmentFilter === 'all' || c.segments.includes(segmentFilter);
    return matchesSearch && matchesSegment;
  });

  const getSegmentBadgeColor = (segment: CustomerSegment) => {
    switch (segment) {
      case 'VIP': return 'bg-purple-100 text-purple-700';
      case 'Fidèle': return 'bg-blue-100 text-blue-700';
      case 'Nouveau': return 'bg-green-100 text-green-700';
      case 'Gros panier': return 'bg-orange-100 text-orange-700';
      case 'À relancer': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Clients</h1>
          <p className="text-brand-text-muted mt-1">{customers.length} clients</p>
        </div>
        <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
        <AdminButton 
            variant="secondary" 
            onClick={() => exportCustomersToCsv(customers)}
        >
            <Download size={20} />
            Export CSV
        </AdminButton>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <AdminSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher (nom, téléphone, zone)..."
          className="flex-1"
        />
        <div className="flex gap-2">
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

      {/* Customers Grid */}
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
                <div className="flex flex-wrap gap-1">
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

              <div className="flex gap-2">
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
              
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}