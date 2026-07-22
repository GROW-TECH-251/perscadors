// src/app/admin/produits/nouveau/page.tsx
// ============================================
// Formulaire d'ajout de produit (avec upload d'images)
// ============================================

'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminInput, AdminTextarea, AdminSelect, AdminToast, AdminConfirmDialog } from '@/admin/components';
import { Save, X, Upload } from 'lucide-react';
import { createProduct } from '@/services/productService';
import { BUCKETS, compressImage, deleteImageByUrl, uploadProductImage } from '@/services/mediaService';
import type { ProductFormData } from '@/admin/types';

function createDraftUploadKey(): string {
  return globalThis.crypto?.randomUUID?.() || `product-${Date.now()}`;
}

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [pendingImageDeletion, setPendingImageDeletion] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadKey] = useState(createDraftUploadKey);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: 'basket-pour-homme',
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Veuillez sélectionner une image valide.', variant: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'L’image ne doit pas dépasser 5 Mo.', variant: 'error' });
      return;
    }

    setUploading(true);
    try {
      const compressedFile = await compressImage(file, 1400);
      const result = await uploadProductImage(compressedFile, uploadKey);

      if (result.error || !result.data) {
        setToast({ message: result.error || 'Erreur d’upload image.', variant: 'error' });
      } else {
        setFormData((currentData) => ({ ...currentData, image_url: result.data || '' }));
      }
    } catch (error: unknown) {
      console.error('Erreur upload image:', error);
      setToast({ message: 'Erreur lors de l’upload de l’image.', variant: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmRemoveImage = async () => {
    if (!formData.image_url) {
      return;
    }

    setPendingImageDeletion(false);
    setDeletingImage(true);
    try {
      const result = await deleteImageByUrl(BUCKETS.PRODUCT_IMAGES, formData.image_url);
      if (result.error) {
        setToast({ message: result.error, variant: 'error' });
        return;
      }

    setFormData((currentData) => ({ ...currentData, image_url: '' }));
    setToast({ message: 'Image supprimée du produit.', variant: 'success' });
    } finally { setDeletingImage(false); }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await createProduct(formData);
      if (result.error) {
        setToast({ message: result.error, variant: 'error' });
        return;
      }

      setToast({ message: 'Produit créé avec succès.', variant: 'success' });
      router.push('/admin/produits');
    } catch (error: unknown) {
      console.error('Erreur création produit:', error);
      setToast({ message: 'Impossible de créer ce produit pour le moment.', variant: 'error' });
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

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
      <AdminConfirmDialog isOpen={pendingImageDeletion} title="Supprimer cette image ?" description="Cette image sera retirée du produit et supprimée du stockage. Cette action est irréversible." loading={deletingImage} onCancel={() => setPendingImageDeletion(false)} onConfirm={handleConfirmRemoveImage} />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Création assistée
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Nouveau Produit</h1>
        </div>
        <AdminButton variant="secondary" onClick={() => router.push('/admin/produits')}>
          <X size={20} />
          Annuler
        </AdminButton>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">Informations de base</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              label="Nom du produit"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              required
            />
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
            <AdminInput
              label="Prix (FCFA)"
              value={formData.price}
              onChange={(value) => setFormData({ ...formData, price: Number(value) || 0 })}
              type="number"
              required
            />
            <AdminInput
              label="Stock"
              value={formData.stock}
              onChange={(value) => setFormData({ ...formData, stock: Number(value) || 0 })}
              type="number"
            />
            <AdminInput
              label="Badge (optionnel)"
              value={formData.badge}
              onChange={(value) => setFormData({ ...formData, badge: value })}
              placeholder="Nouveau, Promo, etc."
            />
          </div>

          <div className="mt-4">
            <AdminTextarea
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              rows={4}
            />
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(event) => setFormData({ ...formData, visible: event.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-brand-text">Produit visible</span>
            </label>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">Image du produit</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-[#0A0A0A] rounded-lg cursor-pointer hover:bg-brand-gold-light transition-colors font-medium"
              >
                <Upload size={18} />
                {uploading ? 'Upload en cours...' : 'Uploader une image'}
              </label>

              {formData.image_url && (
                <button
                  type="button"
                  onClick={() => setPendingImageDeletion(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Supprimer l&apos;image
                </button>
              )}
            </div>

            {formData.image_url && (
              <div className="relative aspect-square bg-brand-bg rounded-lg overflow-hidden max-w-xs border-2 border-brand-gold/20">
                <Image
                  src={formData.image_url}
                  alt="Aperçu du produit"
                  fill
                  sizes="320px"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                  ✓ Image uploadée
                </div>
              </div>
            )}

            <p className="text-xs text-brand-text-muted">
              Formats acceptés: JPG, PNG, WebP • Taille max: 5MB
            </p>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">Tailles</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                value={newSize}
                onChange={(event) => setNewSize(event.target.value)}
                className="flex-1 px-4 py-2 bg-brand-bg border border-brand-gold/20 rounded"
                aria-label="Sélectionner une taille"
              >
                <option value="">Sélectionner une taille</option>
                {['S', 'M', 'L', 'XL', 'XXL', '39', '40', '41', '42', '43', '44', '45'].map((size) => (
                  <option key={size} value={size} disabled={formData.sizes.includes(size)}>
                    {size}
                  </option>
                ))}
              </select>
              <AdminButton type="button" variant="secondary" onClick={handleAddSize} className="mt-6">
                Ajouter
              </AdminButton>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.sizes.map((size) => (
                <span key={size} className="px-3 py-1 bg-brand-bg-alt text-brand-text rounded flex items-center gap-2">
                  {size}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sizes: formData.sizes.filter((currentSize) => currentSize !== size) })}
                    className="text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">Couleurs</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <AdminInput
                label="Nouvelle couleur"
                value={newColor}
                onChange={setNewColor}
                placeholder="Noir, Blanc, etc."
              />
              <AdminButton type="button" variant="secondary" onClick={handleAddColor} className="mt-6">
                Ajouter
              </AdminButton>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.colors.map((color) => (
                <span key={color} className="px-3 py-1 bg-brand-bg-alt text-brand-text rounded flex items-center gap-2">
                  {color}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, colors: formData.colors.filter((currentColor) => currentColor !== color) })}
                    className="text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </AdminCard>

        <div className="flex gap-4">
          <AdminButton type="submit" variant="primary" size="lg" loading={loading || uploading} className="flex-1">
            <Save size={20} />
            Créer le produit
          </AdminButton>
          <AdminButton type="button" variant="secondary" size="lg" onClick={() => router.push('/admin/produits')}>
            Annuler
          </AdminButton>
        </div>
      </form>
    </div>
  );
}