// src/admin/screens/EditProductScreen.tsx
// ============================================
// Écran d'édition de produit
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { AdminCard, AdminButton, AdminInput, AdminTextarea, AdminSelect } from '../components';
import { Save, X, Upload, Trash2 } from 'lucide-react';
import { createProduct, updateProduct, fetchProductById } from '@/services/productService';
import { uploadProductImage } from '@/services/mediaService';
import type { AdminProduct, ProductFormData } from '@/admin/types';

interface EditProductScreenProps {
  product?: AdminProduct | null;
  onSave: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  { value: 'basket-pour-homme', label: 'Baskets Homme' },
  { value: 'complet-pour-homme', label: 'Complets Streetwear' },
  { value: 'jean-overside-pour-homme', label: 'Jeans Oversize' },
  { value: 'tapettes-pour-homme', label: 'Tapettes & Sandales' }
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '39', '40', '41', '42', '43', '44', '45'];

export const EditProductScreen: React.FC<EditProductScreenProps> = ({
  product,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    category: 'basket-pour-homme',
    price: 0,
    stock: undefined,
    sizes: [],
    colors: [],
    outOfStockSizes: [],
    outOfStockColors: [],
    images: [],
    description: '',
    visible: true,
    badge: '',
    isPopular: false
  });

  const [loading, setLoading] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Déclarer loadProduct AVANT useEffect avec useCallback
  const loadProduct = useCallback(async (id: string) => {
    try {
      const data = await fetchProductById(id);
      if (data) {
        setFormData({
          name: data.name,
          slug: data.slug,
          category: data.category,
          price: data.price,
          stock: data.stock,
          sizes: data.sizes || [],
          colors: data.colors || [],
          outOfStockSizes: data.outOfStockSizes || [],
          outOfStockColors: data.outOfStockColors || [],
          images: data.images || [],
          description: data.description,
          visible: data.visible,
          badge: data.badge || '',
          isPopular: data.isPopular || false
        });
      }
    } catch (err: unknown) {
      console.error('Erreur chargement produit:', err);
    }
  }, []);

  // Maintenant useEffect peut appeler loadProduct
  useEffect(() => {
    if (product?.id) {
      loadProduct(product.id);
    }
  }, [product?.id, loadProduct]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const productId = product?.id || `temp-${Date.now()}`;
      const result = await uploadProductImage(file, productId);

      if (result.data) {
        setFormData({
          ...formData,
          images: [...formData.images, result.data]
        });
      }
    } catch (err: unknown) {
      console.error('Erreur upload image:', err);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleAddSize = () => {
    if (newSize && !formData.sizes.includes(newSize)) {
      setFormData({
        ...formData,
        sizes: [...formData.sizes, newSize]
      });
      setNewSize('');
    }
  };

  const handleRemoveSize = (size: string) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.filter(s => s !== size),
      outOfStockSizes: formData.outOfStockSizes.filter(s => s !== size)
    });
  };

  const handleAddColor = () => {
    if (newColor && !formData.colors.includes(newColor)) {
      setFormData({
        ...formData,
        colors: [...formData.colors, newColor]
      });
      setNewColor('');
    }
  };

  const handleRemoveColor = (color: string) => {
    setFormData({
      ...formData,
      colors: formData.colors.filter(c => c !== color),
      outOfStockColors: formData.outOfStockColors.filter(c => c !== color)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (product?.id) {
        await updateProduct(product.id, formData);
      } else {
        await createProduct(formData);
      }
      onSave();
    } catch (err: unknown) {
      console.error('Erreur sauvegarde produit:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
          {product?.id ? 'Modifier le produit' : 'Nouveau produit'}
        </h1>
        <AdminButton variant="secondary" onClick={onCancel}>
          <X size={20} />
          Annuler
        </AdminButton>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">
            Informations de base
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              label="Nom du produit"
              value={formData.name}
              onChange={(v) => setFormData({ ...formData, name: v })}
              required
            />
            <AdminInput
              label="Slug (URL)"
              value={formData.slug}
              onChange={(v) => setFormData({ ...formData, slug: v })}
              placeholder="mon-produit"
              required
            />
            <AdminSelect
              label="Catégorie"
              value={formData.category}
              onChange={(v) => setFormData({ ...formData, category: v })}
              options={CATEGORIES}
              required
            />
            <AdminInput
              label="Prix (FCFA)"
              value={formData.price}
              onChange={(v) => setFormData({ ...formData, price: Number(v) || 0 })}
              type="number"
              required
            />
            <AdminInput
              label="Stock"
              value={formData.stock?.toString() || ''}
              onChange={(v) => setFormData({ ...formData, stock: v ? Number(v) : undefined })}
              type="number"
              placeholder="Laisser vide pour stock illimité"
            />
            <AdminInput
              label="Badge (optionnel)"
              value={formData.badge}
              onChange={(v) => setFormData({ ...formData, badge: v })}
              placeholder="Nouveau, Promo, etc."
            />
          </div>

          <div className="mt-4">
            <AdminTextarea
              label="Description"
              value={formData.description}
              onChange={(v) => setFormData({ ...formData, description: v })}
              rows={4}
              required
            />
          </div>

          <div className="mt-4 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-brand-text">Produit visible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-brand-text">Produit populaire</span>
            </label>
          </div>
        </AdminCard>

        {/* Images */}
        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">
            Images
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-[#0A0A0A] rounded cursor-pointer hover:bg-brand-gold-light transition-colors">
                <Upload size={18} />
                <span>{uploadingImage ? 'Upload...' : 'Uploader une image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative aspect-square bg-brand-bg rounded-lg overflow-hidden group">
                    <img src={img} alt={`Product ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      aria-label="Supprimer image"
                    >
                      <Trash2 size={14} />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-brand-gold text-[#0A0A0A] text-xs rounded">
                        Principale
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminCard>

        {/* Sizes */}
        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">
            Tailles
          </h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                className="flex-1 px-4 py-2 bg-brand-bg border border-brand-gold/20 rounded"
                aria-label="Sélectionner une taille"
              >
                <option value="">Sélectionner une taille</option>
                {SIZES.map((size) => (
                  <option key={size} value={size} disabled={formData.sizes.includes(size)}>
                    {size}
                  </option>
                ))}
              </select>
              <AdminButton type="button" variant="secondary" onClick={handleAddSize}>
                Ajouter
              </AdminButton>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.sizes.map((size) => (
                <span
                  key={size}
                  className="px-3 py-1 bg-brand-bg-alt text-brand-text rounded flex items-center gap-2"
                >
                  {size}
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={formData.outOfStockSizes.includes(size)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            outOfStockSizes: [...formData.outOfStockSizes, size]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            outOfStockSizes: formData.outOfStockSizes.filter(s => s !== size)
                          });
                        }
                      }}
                      className="w-3 h-3"
                    />
                    Épuisé
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(size)}
                    className="text-red-500 hover:text-red-600 cursor-pointer"
                    aria-label="Supprimer taille"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </AdminCard>

        {/* Colors */}
        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">
            Couleurs
          </h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="Nouvelle couleur"
                className="flex-1 px-4 py-2 bg-brand-bg border border-brand-gold/20 rounded"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                aria-label="Nouvelle couleur"
              />
              <AdminButton type="button" variant="secondary" onClick={handleAddColor}>
                Ajouter
              </AdminButton>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.colors.map((color) => (
                <span
                  key={color}
                  className="px-3 py-1 bg-brand-bg-alt text-brand-text rounded flex items-center gap-2"
                >
                  {color}
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={formData.outOfStockColors.includes(color)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            outOfStockColors: [...formData.outOfStockColors, color]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            outOfStockColors: formData.outOfStockColors.filter(c => c !== color)
                          });
                        }
                      }}
                      className="w-3 h-3"
                    />
                    Épuisé
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(color)}
                    className="text-red-500 hover:text-red-600 cursor-pointer"
                    aria-label="Supprimer couleur"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </AdminCard>

        {/* Submit */}
        <div className="flex gap-4">
          <AdminButton
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="flex-1"
          >
            <Save size={20} />
            {product?.id ? 'Mettre à jour' : 'Créer le produit'}
          </AdminButton>
          <AdminButton
            type="button"
            variant="secondary"
            size="lg"
            onClick={onCancel}
          >
            Annuler
          </AdminButton>
        </div>
      </form>
    </div>
  );
};