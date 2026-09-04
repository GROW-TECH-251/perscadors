// src/app/admin/produits/[id]/page.tsx
// ============================================
// Formulaire d'édition de produit
// ============================================

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { AdminCard, AdminButton, AdminInput, AdminTextarea, AdminSelect, AdminToast, AdminConfirmDialog } from '@/admin/components';
import {Video,  Save, X, Upload } from 'lucide-react';
import { fetchProductById, updateProduct } from '@/services/productService';
import { BUCKETS, compressImage, deleteImageByUrl, deleteProductVideo, uploadProductImage, uploadProductVideo } from '@/services/mediaService';
import type { ProductFormData } from '@/admin/types';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [pendingImageDeletion, setPendingImageDeletion] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  // IMP-08 — Vidéo produit : états d’upload/suppression.
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [pendingVideoDeletion, setPendingVideoDeletion] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(false);
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
    video_url: null,
    video_public_id: null,
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
          video_url: data.video_url || null,
          video_public_id: data.video_public_id || null,
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
      const result = await uploadProductImage(compressedFile, productId);

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

  // IMP-08 — Vidéo produit optionnelle (Cloudinary, MP4 H.264/AAC, ≤ 30 Mo).
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|webm)$/i)) {
      setToast({ message: 'Veuillez sélectionner un fichier vidéo valide (MP4, WebM ou MOV).', variant: 'error' });
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setToast({ message: 'La vidéo ne doit pas dépasser 30 Mo.', variant: 'error' });
      return;
    }

    setVideoUploading(true);
    try {
      const result = await uploadProductVideo(file, productId);
      if (result.error || !result.url) {
        setToast({ message: result.error || 'Erreur d’upload vidéo.', variant: 'error' });
      } else {
        if (formData.video_public_id) {
          void deleteProductVideo(formData.video_public_id);
        }
        setFormData((currentData) => ({ ...currentData, video_url: result.url, video_public_id: result.publicId }));
        setToast({ message: 'Vidéo ajoutée au produit.', variant: 'success' });
      }
    } catch (error: unknown) {
      console.error('Erreur upload vidéo:', error);
      setToast({ message: 'Erreur lors de l’upload de la vidéo.', variant: 'error' });
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleConfirmRemoveVideo = async () => {
    setPendingVideoDeletion(false);
    setDeletingVideo(true);
    try {
      await deleteProductVideo(formData.video_public_id);
      setFormData((currentData) => ({ ...currentData, video_url: null, video_public_id: null }));
      setToast({ message: 'Vidéo supprimée du produit.', variant: 'success' });
    } finally {
      setDeletingVideo(false);
    }
  };

  const submittingRef = useRef(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Audit latence 09/2026 — garde absolue anti double-soumission (fichier
    // manquant du commit a607666 : seul « nouveau » l'avait reçue).
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);

    try {
      const result = await updateProduct(Number(productId), formData);
      if (result.error) {
        setToast({ message: result.error, variant: 'error' });
        return;
      }

      setToast({ message: 'Produit mis à jour avec succès.', variant: 'success' });
      router.push('/admin/produits');
    } catch (error: unknown) {
      console.error('Erreur mise à jour produit:', error);
      setToast({ message: 'Impossible de mettre à jour ce produit pour le moment.', variant: 'error' });
    } finally {
      submittingRef.current = false;
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
      {toast && <AdminToast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
      <AdminConfirmDialog isOpen={pendingImageDeletion} title="Supprimer cette image ?" description="Cette image sera retirée du produit et supprimée du stockage. Cette action est irréversible." loading={deletingImage} onCancel={() => setPendingImageDeletion(false)} onConfirm={handleConfirmRemoveImage} />
      <AdminConfirmDialog isOpen={pendingVideoDeletion} title="Supprimer cette vidéo ?" description="Cette vidéo sera retirée du produit et supprimée de Cloudinary. Cette action est irréversible." loading={deletingVideo} onCancel={() => setPendingVideoDeletion(false)} onConfirm={handleConfirmRemoveVideo} />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Édition premium
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Modifier le Produit</h1>
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
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                id="edit-image-upload"
              />
              <label
                htmlFor="edit-image-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold text-[#0A0A0A] rounded-lg cursor-pointer hover:bg-brand-gold-light transition-colors font-medium"
              >
                <Upload size={18} />
                {uploading ? 'Upload en cours...' : 'Remplacer l’image'}
              </label>
              {formData.image_url && (
                <AdminButton type="button" variant="danger" onClick={() => setPendingImageDeletion(true)}>
                  Supprimer l’image
                </AdminButton>
              )}
            </div>


            {formData.image_url && (
              <div className="mt-4 relative aspect-square bg-brand-bg rounded-lg overflow-hidden max-w-xs">
                <Image
                  src={formData.image_url}
                  alt={formData.name}
                  fill
                  sizes="320px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4 flex items-center gap-2">
            <Video size={18} />
            Vidéo du produit (optionnelle)
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoUpload}
                disabled={videoUploading}
                className="hidden"
                id="edit-video-upload"
              />
              <label
                htmlFor="edit-video-upload"
                className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-[#0A0A0A] rounded-lg cursor-pointer hover:bg-brand-gold-light transition-colors font-medium"
              >
                <Upload size={18} />
                {videoUploading ? 'Upload en cours...' : 'Uploader une vidéo'}
              </label>

              {formData.video_url && (
                <button
                  type="button"
                  onClick={() => setPendingVideoDeletion(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Supprimer la vidéo
                </button>
              )}
            </div>

            {formData.video_url && (
              <div className="max-w-xs border-2 border-brand-gold/20 rounded-lg overflow-hidden bg-brand-bg">
                <video
                  src={formData.video_url}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="Aperçu de la vidéo du produit"
                  className="w-full aspect-video bg-black object-contain"
                />
                <div className="px-2 py-1 text-xs text-green-500 text-center">✓ Vidéo uploadée</div>
              </div>
            )}

            <p className="text-xs text-brand-text-muted">
              Formats acceptés: MP4, WebM, MOV • Taille max: 30 Mo • Transcodage automatique en MP4 H.264/AAC
            </p>
          </div>
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
          <AdminButton type="submit" variant="primary" size="lg" loading={loading || uploading || videoUploading} className="flex-1">
            <Save size={20} /> Mettre à jour
          </AdminButton>
          <AdminButton type="button" variant="secondary" size="lg" onClick={() => router.push('/admin/produits')}>Annuler</AdminButton>
        </div>
      </form>
    </div>
  );
}