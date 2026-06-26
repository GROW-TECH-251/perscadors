// src/admin/screens/CustomersScreen.tsx
// ============================================
// Écran de gestion des clients
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminModal, AdminTextarea } from '../components';
import { Users, Phone, MapPin, Tag, Save, MessageCircle, Copy } from 'lucide-react';
import { fetchCustomerSummaries, upsertCustomerMeta, addCustomerTag, removeCustomerTag } from '@/services/customerService';
import type { CustomerSummary, CustomerSegment } from '@/admin/types';

interface CustomersScreenProps {
  onBack: () => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({ onBack }) => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | 'all'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerSummaries();
      setCustomers(data);
    } catch (err: unknown) {
      console.error('Erreur chargement clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await loadCustomers();
    };
    loadData();
  }, [loadCustomers]);

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;

    try {
      // CORRECTION: upsertCustomerMeta prend (phone, meta) où meta est un objet
      await upsertCustomerMeta(selectedCustomer.phone, { notes, tags });
      await loadCustomers();
      alert('Notes enregistrées !');
    } catch (err: unknown) {
      console.error('Erreur sauvegarde notes:', err);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleAddTag = async () => {
    if (!selectedCustomer || !newTag.trim()) return;

    try {
      await addCustomerTag(selectedCustomer.phone, newTag.trim());
      setTags([...tags, newTag.trim()]);
      setNewTag('');
      await loadCustomers();
    } catch (err: unknown) {
      console.error('Erreur ajout tag:', err);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedCustomer) return;

    try {
      await removeCustomerTag(selectedCustomer.phone, tagToRemove);
      setTags(tags.filter(t => t !== tagToRemove));
      await loadCustomers();
    } catch (err: unknown) {
      console.error('Erreur suppression tag:', err);
    }
  };

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

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSegment = segmentFilter === 'all' || customer.segments.includes(segmentFilter);

    return matchesSearch && matchesSegment;
  });

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
            Clients
          </h1>
          <p className="text-brand-text-muted mt-1">
            {customers.length} client{customers.length > 1 ? 's' : ''}
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
          placeholder="Rechercher (nom, téléphone, zone)..."
          className="flex-1"
        />
        <AdminButton
          variant={segmentFilter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSegmentFilter('all')}
        >
          Tous
        </AdminButton>
        <AdminButton
          variant={segmentFilter === 'VIP' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSegmentFilter('VIP')}
        >
          VIP
        </AdminButton>
        <AdminButton
          variant={segmentFilter === 'Fidèle' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSegmentFilter('Fidèle')}
        >
          Fidèles
        </AdminButton>
        <AdminButton
          variant={segmentFilter === 'À relancer' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSegmentFilter('À relancer')}
        >
          À relancer
        </AdminButton>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <AdminEmptyState
          icon={<Users size={48} />}
          title="Aucun client trouvé"
          description={searchQuery || segmentFilter !== 'all' ? 'Essayez d\'autres filtres' : 'Les clients apparaîtront ici'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <AdminCard
              key={customer.phone}
              className="cursor-pointer hover:bg-brand-gold/5 transition-colors"
              onClick={() => {
                setSelectedCustomer(customer);
                setNotes(customer.notes || '');
                setTags(customer.tags || []);
                setIsDetailModalOpen(true);
              }}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bebas text-xl text-brand-text uppercase">
                      {customer.name}
                    </h3>
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

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-brand-text-muted">Commandes</p>
                    <p className="font-bold text-brand-text">{customer.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-brand-text-muted">Total dépensé</p>
                    <p className="font-bold text-brand-gold">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                </div>

                {/* Last Order */}
                <div className="pt-3 border-t border-brand-gold/10">
                  <p className="text-xs text-brand-text-muted">
                    Dernière commande : {new Date(customer.lastOrderDate).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-brand-text-muted">
                    Statut : {customer.lastOrderStatus}
                  </p>
                </div>

                {/* Tags */}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-brand-bg-alt text-brand-text text-xs rounded"
                      >
                        <Tag size={10} className="inline mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <AdminModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCustomer(null);
          }}
          title={`Client : ${selectedCustomer.name}`}
          footer={
            <div className="flex gap-3">
              <AdminButton
                variant="secondary"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedCustomer(null);
                }}
              >
                Fermer
              </AdminButton>
              <AdminButton variant="primary" onClick={handleSaveNotes}>
                <Save size={16} />
                Enregistrer
              </AdminButton>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-brand-gold" />
                <div>
                  <p className="text-xs text-brand-text-muted">Téléphone</p>
                  <p className="font-medium text-brand-text">{selectedCustomer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-brand-gold" />
                <div>
                  <p className="text-xs text-brand-text-muted">Zone</p>
                  <p className="font-medium text-brand-text">{selectedCustomer.area}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <AdminCard className="text-center p-4">
                <p className="text-2xl font-bebas text-brand-text">{selectedCustomer.orderCount}</p>
                <p className="text-xs text-brand-text-muted">Commandes</p>
              </AdminCard>
              <AdminCard className="text-center p-4">
                <p className="text-2xl font-bebas text-brand-gold">{formatCurrency(selectedCustomer.totalSpent)}</p>
                <p className="text-xs text-brand-text-muted">Total dépensé</p>
              </AdminCard>
              <AdminCard className="text-center p-4">
                <p className="text-2xl font-bebas text-brand-text">
                  {Math.round(selectedCustomer.totalSpent / selectedCustomer.orderCount)}
                </p>
                <p className="text-xs text-brand-text-muted">Panier moyen</p>
              </AdminCard>
            </div>

            {/* Segments */}
            <div>
              <p className="text-sm text-brand-text-muted mb-2">Segments</p>
              <div className="flex flex-wrap gap-2">
                {selectedCustomer.segments.map((segment) => (
                  <span
                    key={segment}
                    className={`px-3 py-1 text-sm font-medium rounded ${getSegmentBadgeColor(segment)}`}
                  >
                    {segment}
                  </span>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-brand-text-muted mb-2">Tailles préférées</p>
                <div className="flex flex-wrap gap-1">
                  {selectedCustomer.preferredSizes.map((size) => (
                    <span key={size} className="px-2 py-1 bg-brand-bg-alt text-brand-text text-xs rounded">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted mb-2">Couleurs préférées</p>
                <div className="flex flex-wrap gap-1">
                  {selectedCustomer.preferredColors.map((color) => (
                    <span key={color} className="px-2 py-1 bg-brand-bg-alt text-brand-text text-xs rounded">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="text-sm text-brand-text-muted mb-2">Tags</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-sm rounded flex items-center gap-1"
                  >
                    <Tag size={12} />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 cursor-pointer"
                      aria-label="Supprimer tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nouveau tag..."
                  className="flex-1 px-3 py-2 bg-brand-bg border border-brand-gold/20 rounded text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <AdminButton variant="secondary" size="sm" onClick={handleAddTag}>
                  Ajouter
                </AdminButton>
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-sm text-brand-text-muted mb-2">Notes internes</p>
              <AdminTextarea
                value={notes}
                onChange={setNotes}
                placeholder="Ajouter des notes sur ce client..."
                rows={4}
              />
            </div>

            {/* WhatsApp Relance */}
            <div>
              <p className="text-sm text-brand-text-muted mb-2">Relance WhatsApp</p>
              <div className="p-3 bg-brand-bg-alt rounded-lg border border-brand-gold/10">
                <p className="text-sm text-brand-text mb-3">
                  Bonjour {selectedCustomer.name}, merci pour votre confiance chez HP Collection ! 
                  Découvrez nos nouvelles arrivées cette semaine. 🛍️
                </p>
                <div className="flex gap-2">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(`Bonjour ${selectedCustomer.name}, merci pour votre confiance chez HP Collection ! Découvrez nos nouvelles arrivées cette semaine. 🛍️`)}
                  >
                    <Copy size={14} />
                    Copier
                  </AdminButton>
                  <AdminButton
                    variant="success"
                    size="sm"
                    onClick={() => openWhatsApp(selectedCustomer.phone, `Bonjour ${selectedCustomer.name}, merci pour votre confiance chez HP Collection ! Découvrez nos nouvelles arrivées cette semaine. 🛍️`)}
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </AdminButton>
                </div>
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
};