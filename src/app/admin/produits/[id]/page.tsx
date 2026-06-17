// src/app/admin/produits/[id]/page.tsx
// ============================================
// Formulaire d'édition de produit
// ============================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminCard, AdminButton, AdminInput, AdminTextarea, AdminSelect } from '@/admin/components';
import { Save, X } from 'lucide-react';
import { fetchProductById, updateProduct } from '@/services/productService';
import type { ProductFormData } from '@/admin/types';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    price: 0,
    image_url: '',
    sizes: [],
    colors: [],
    stock: 0,
    demand: 0,
    badge: '',
    description: '',
    visible: true
  });

  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  const loadProduct = useCallback(async () => {
    setFetching(true);
    try {
      const data = await fetchProductById(Number(productId));
      if (data) {
        setFormData({
          name: data.name,
          category: data.category,
          price: data.price,
          image_url: data.image_url || '',
          sizes: data.sizes || [],
          colors: data.colors || [],
          stock: data.stock || 0,
          demand: data.demand || 0,
          badge: data.badge || '',
          description: data.description || '',
          visible: data.visible
        });
      }
    } catch (error: unknown) {
      console.error('Erreur chargement produit:', error);
    } finally {
      setFetching(false);
    }
  }, [productId]);

  useEffect(() => {
    const init = async () => {
      await loadProduct();
    };
    init();
  }, [loadProduct]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await updateProduct(Number(productId), formData);
      if (result.error) {
        alert(result.error);
        return;
      }

      alert('Produit mis à jour avec succès !');
      router.push('/admin/produits');
    } catch (error: unknown) {
      console.error('Erreur mise à jour produit:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSize = () => {
    if (newSize && !formData.sizes.includes(newSize)) {
      setFormData({ ...formData, sizes: [...formData.sizes, newSize] });
      setNewSize('');
    }
  };

  const handleAddColor = () => {
    if (newColor && !formData.colors.includes(newColor)) {
      setFormData({ ...formData, colors: [...formData.colors, newColor] });
      setNewColor('');
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Modifier le Produit</h1>
        <AdminButton variant="secondary" onClick={() => router.push('/admin/produits')}>
          <X size={20} />
          Annuler
        </AdminButton>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">Informations de base</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput label="Nom du produit" value={formData.name} onChange={(value) => setFormData({ ...formData, name: value })} required />
            <AdminSelect
              label="Catégorie"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              options={[
                { value: 'basket-pour-homme', label: 'Baskets Homme' },
                { value: 'complet-pour-homme', label: 'Complets Streetwear' },
                { value: 'jean-overside-pour-homme', label: 'Jeans Oversize' },
                { value: 'tapettes-pour-homme', label: 'Tapettes & Sandales' }
              ]}
              required
            />
            <AdminInput label="Prix (FCFA)" value={formData.price} onChange={(value) => setFormData({ ...formData, price: Number(value) || 0 })} type="number" required />
            <AdminInput label="Stock" value={formData.stock} onChange={(value) => setFormData({ ...formData, stock: Number(value) || 0 })} type="number" />
            <AdminInput label="Badge" value={formData.badge} onChange={(value) => setFormData({ ...formData, badge: value })} placeholder="Nouveau, Promo..." />
          </div>
          <div className="mt-4">
            <AdminTextarea label="Description" value={formData.description} onChange={(value) => setFormData({ ...formData, description: value })} rows={4} />
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.visible} onChange={(event) => setFormData({ ...formData, visible: event.target.checked })} className="w-4 h-4" />
              <span className="text-sm text-brand-text">Produit visible</span>
            </label>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">Image</h2>
          <AdminInput label="URL de l'image" value={formData.image_url} onChange={(value) => setFormData({ ...formData, image_url: value })} placeholder="/images/ARTICLES/..." />
          {formData.image_url && (
            <div className="mt-4 relative aspect-square bg-brand-bg rounded-lg overflow-hidden max-w-xs">
              <img src={formData.image_url} alt={formData.name} className="w-full h-full object-cover" />
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">Tailles</h2>
          <div className="flex gap-2 mb-4">
            <select
              value={newSize}
              onChange={(event) => setNewSize(event.target.value)}
              className="flex-1 px-4 py-2 bg-brand-bg border border-brand-gold/20 rounded"
              aria-label="Sélectionner une taille"
            >
              <option value="">Sélectionner une taille</option>
              {['S', 'M', 'L', 'XL', 'XXL', '39', '40', '41', '42', '43', '44', '45'].map((size) => (
                <option key={size} value={size} disabled={formData.sizes.includes(size)}>{size}</option>
              ))}
            </select>
            <AdminButton type="button" variant="secondary" onClick={handleAddSize} className="mt-6">Ajouter</AdminButton>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.sizes.map((size) => (
              <span key={size} className="px-3 py-1 bg-brand-bg-alt text-brand-text rounded flex items-center gap-2">
                {size}
                <button type="button" onClick={() => setFormData({ ...formData, sizes: formData.sizes.filter((currentSize) => currentSize !== size) })} className="text-red-500 hover:text-red-600 cursor-pointer">×</button>
              </span>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">Couleurs</h2>
          <div className="flex gap-2 mb-4">
            <AdminInput label="Nouvelle couleur" value={newColor} onChange={setNewColor} placeholder="Noir, Blanc..." />
            <AdminButton type="button" variant="secondary" onClick={handleAddColor} className="mt-6">Ajouter</AdminButton>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.colors.map((color) => (
              <span key={color} className="px-3 py-1 bg-brand-bg-alt text-brand-text rounded flex items-center gap-2">
                {color}
                <button type="button" onClick={() => setFormData({ ...formData, colors: formData.colors.filter((currentColor) => currentColor !== color) })} className="text-red-500 hover:text-red-600 cursor-pointer">×</button>
              </span>
            ))}
          </div>
        </AdminCard>

        <div className="flex gap-4">
          <AdminButton type="submit" variant="primary" size="lg" loading={loading} className="flex-1">
            <Save size={20} /> Mettre à jour
          </AdminButton>
          <AdminButton type="button" variant="secondary" size="lg" onClick={() => router.push('/admin/produits')}>Annuler</AdminButton>
        </div>
      </form>
    </div>
  );
}