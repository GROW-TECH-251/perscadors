// src/admin/screens/ProductsScreen.tsx
// ============================================
// Écran de gestion des produits
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminBadge } from '../components';
import { Package, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { fetchAdminProducts, deleteProduct } from '@/services/productService';
import type { AdminProduct } from '@/admin/types';

interface ProductsScreenProps {
  onEdit: (product: AdminProduct) => void;
  onBack: () => void;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({ onEdit, onBack }) => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'low-stock'>('all');

  // Déclarer la fonction AVANT useEffect avec useCallback
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (err: unknown) {
      console.error('Erreur chargement produits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Maintenant useEffect peut appeler loadProducts
  useEffect(() => {
    const loadData = async () => {
      await loadProducts();
    };
    loadData();
  }, [loadProducts]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err: unknown) {
      console.error('Erreur suppression produit:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const filteredProducts = products.filter((product) => {
    // Filter by search
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by status
    const matchesFilter =
      filter === 'all' ||
      (filter === 'visible' && product.visible) ||
      (filter === 'hidden' && !product.visible) ||
      (filter === 'low-stock' && (product.stock || 0) <= 5);

    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des produits...</p>
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
            Produits
          </h1>
          <p className="text-brand-text-muted mt-1">
            {products.length} produit{products.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <AdminButton variant="secondary" size="md" onClick={onBack}>
            Retour
          </AdminButton>
          <AdminButton
            variant="primary"
            size="md"
            onClick={() => onEdit({} as AdminProduct)}
          >
            <Plus size={20} />
            Nouveau produit
          </AdminButton>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <AdminSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un produit..."
          className="flex-1"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('visible')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === 'visible'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            Visibles
          </button>
          <button
            onClick={() => setFilter('hidden')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === 'hidden'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            Cachés
          </button>
          <button
            onClick={() => setFilter('low-stock')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === 'low-stock'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            Stock faible
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <AdminEmptyState
          icon={<Package size={48} />}
          title="Aucun produit trouvé"
          description={searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier produit'}
          action={
            !searchQuery && (
              <AdminButton variant="primary" onClick={() => onEdit({} as AdminProduct)}>
                <Plus size={20} />
                Ajouter un produit
              </AdminButton>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <AdminCard key={product.id} className="p-0 overflow-hidden">
              {/* Product Image */}
              <div className="relative aspect-square bg-brand-bg">
                <img
                  src={product.images?.[0] || '/images/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {!product.visible && (
                    <AdminBadge variant="default">Caché</AdminBadge>
                  )}
                  {(product.stock || 0) <= 5 && (
                    <AdminBadge variant="danger">Stock faible</AdminBadge>
                  )}
                  {product.isPopular && (
                    <AdminBadge variant="success">Populaire</AdminBadge>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(product)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-brand-gold hover:text-white transition-colors cursor-pointer"
                    aria-label="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bebas text-lg text-brand-text uppercase leading-tight truncate">
                    {product.name}
                  </h3>
                  <p className="text-xs text-brand-text-muted mt-1">
                    {product.category}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-brand-gold">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-xs text-brand-text-muted">
                    Stock: {product.stock || '∞'}
                  </span>
                </div>

                {/* Sizes & Colors */}
                <div className="flex flex-wrap gap-1">
                  {product.sizes?.slice(0, 4).map((size) => (
                    <span
                      key={size}
                      className="px-2 py-0.5 bg-brand-bg-alt text-brand-text text-xs rounded"
                    >
                      {size}
                    </span>
                  ))}
                  {product.sizes && product.sizes.length > 4 && (
                    <span className="px-2 py-0.5 text-brand-text-muted text-xs">
                      +{product.sizes.length - 4}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-brand-gold/10">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEdit(product)}
                  >
                    <Edit size={14} />
                    Modifier
                  </AdminButton>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
};