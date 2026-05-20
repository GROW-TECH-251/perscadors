// src/admin/screens/StockAlertsScreen.tsx
// ============================================
// Écran des alertes de stock
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { AdminCard, AdminButton, AdminEmptyState } from '../components';
import { AlertTriangle, Package, Edit } from 'lucide-react';
import { fetchAdminProducts, updateProduct } from '@/services/productService';
import type { AdminProduct } from '@/admin/types';

interface StockAlertsScreenProps {
  onBack: () => void;
  onEditProduct: (product: AdminProduct) => void;
}

export const StockAlertsScreen: React.FC<StockAlertsScreenProps> = ({ onBack, onEditProduct }) => {
  const [lowStockProducts, setLowStockProducts] = useState<AdminProduct[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const products = await fetchAdminProducts();
      
      const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5);
      const outOfStock = products.filter(p => (p.stock || 0) === 0);

      setLowStockProducts(lowStock);
      setOutOfStockProducts(outOfStock);
    } catch (err: unknown) {
      console.error('Erreur chargement produits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadProducts();
    };
    load();
  }, [loadProducts]);

  const handleQuickRestock = async (product: AdminProduct, quantity: number) => {
    try {
      await updateProduct(product.id, {
        stock: (product.stock || 0) + quantity
      });
      await loadProducts();
      alert(`Stock mis à jour : ${product.name}`);
    } catch (err: unknown) {
      console.error('Erreur mise à jour stock:', err);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des alertes...</p>
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
            Alertes Stock
          </h1>
          <p className="text-brand-text-muted mt-1">
            {lowStockProducts.length} produits en stock faible • {outOfStockProducts.length} en rupture
          </p>
        </div>
        <AdminButton variant="secondary" onClick={onBack}>
          Retour
        </AdminButton>
      </div>

      {/* Out of Stock */}
      {outOfStockProducts.length > 0 && (
        <AdminCard className="border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={24} className="text-red-500" />
            <h2 className="font-bebas text-xl text-red-600 uppercase">
              Rupture de stock ({outOfStockProducts.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outOfStockProducts.map((product) => (
              <div
                key={product.id}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bebas text-lg text-brand-text uppercase">
                      {product.name}
                    </h3>
                    <p className="text-xs text-brand-text-muted">{product.category}</p>
                  </div>
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
                    Épuisé
                  </span>
                </div>

                <div className="flex gap-2">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEditProduct(product)}
                  >
                    <Edit size={14} />
                    Modifier
                  </AdminButton>
                  <button
                    onClick={() => handleQuickRestock(product, 10)}
                    className="px-3 py-2 bg-brand-gold text-[#0A0A0A] text-sm rounded hover:bg-brand-gold-light transition-colors cursor-pointer"
                  >
                    +10
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Low Stock */}
      {lowStockProducts.length > 0 && (
        <AdminCard className="border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={24} className="text-yellow-500" />
            <h2 className="font-bebas text-xl text-yellow-600 uppercase">
              Stock faible ({lowStockProducts.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bebas text-lg text-brand-text uppercase">
                      {product.name}
                    </h3>
                    <p className="text-xs text-brand-text-muted">{product.category}</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded font-bold">
                    {product.stock} restants
                  </span>
                </div>

                <div className="flex gap-2">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEditProduct(product)}
                  >
                    <Edit size={14} />
                    Modifier
                  </AdminButton>
                  <button
                    onClick={() => handleQuickRestock(product, 5)}
                    className="px-3 py-2 bg-brand-gold text-[#0A0A0A] text-sm rounded hover:bg-brand-gold-light transition-colors cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* All Good */}
      {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
        <AdminEmptyState
          icon={<Package size={48} />}
          title="Tout va bien !"
          description="Aucun produit en stock faible ou en rupture"
        />
      )}
    </div>
  );
};