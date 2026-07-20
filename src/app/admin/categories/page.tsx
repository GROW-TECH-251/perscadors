// src/app/admin/categories/page.tsx
// ============================================
// Gestion des Catégories / collections dynamiques
// ============================================

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminInput, AdminEmptyState, AdminTextarea, AdminToast, AdminConfirmDialog } from '@/admin/components';
import { Tag, Plus, Edit, Trash2, Eye, EyeOff, X, Save, Upload } from 'lucide-react';
import { fetchCategories, updateCategory, deleteCategory, createCategory } from '@/services/categoryService';
import { BUCKETS, compressImage, deleteImageByUrl, uploadBrandAsset } from '@/services/mediaService';
import type { AdminCategory } from '@/admin/types';

interface CategoryFormState {
  name: string;
  category: string;
  description: string;
  image_url: string;
  visible: boolean;
  position: number;
}

function slugifyCategory(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState<CategoryFormState>({
    name: '',
    category: '',
    description: '',
    image_url: '',
    visible: true,
    position: 0
  });

  const resetForm = useCallback(() => {
    setEditingId(null);
    setNewCategory(false);
    setFormData({
      name: '',
      category: '',
      description: '',
      image_url: '',
      visible: true,
      position: categories.length
    });
  }, [categories.length]);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error: unknown) {
      console.error('Erreur chargement catégories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadCategories();
    };
    init();
  }, [loadCategories]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        const result = await updateCategory(editingId, formData);
        if (result.error) {
          setToast({ message: result.error, variant: 'error' });
          return;
        }
        setToast({ message: 'Catégorie mise à jour.', variant: 'success' });
      } else {
        const result = await createCategory(formData);
        if (result.error) {
          setToast({ message: result.error, variant: 'error' });
          return;
        }
        setToast({ message: 'Catégorie créée.', variant: 'success' });
      }

      await loadCategories();
      resetForm();
    } catch (error: unknown) {
      console.error('Erreur sauvegarde catégorie:', error);
      setToast({ message: 'Impossible d’enregistrer cette catégorie pour le moment.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      category: category.category,
      description: category.description || '',
      image_url: category.image_url || '',
      visible: category.visible,
      position: category.position
    });
    setNewCategory(false);
  };

  const handleDelete = async (id: number) => {
    setPendingDeleteId(null);
    try {
      const result = await deleteCategory(id);
      if (result.error) {
        setToast({ message: result.error, variant: 'error' });
        return;
      }
      await loadCategories();
    } catch (error: unknown) {
      console.error('Erreur suppression catégorie:', error);
      setToast({ message: 'Impossible de supprimer cette catégorie pour le moment.', variant: 'error' });
    }
  };

  const handleToggleVisibility = async (id: number, currentVisible: boolean) => {
    try {
      const result = await updateCategory(id, { visible: !currentVisible });
      if (result.error) {
        setToast({ message: result.error, variant: 'error' });
        return;
      }
      await loadCategories();
    } catch (error: unknown) {
      console.error('Erreur mise à jour catégorie:', error);
      setToast({ message: 'Impossible de mettre à jour cette catégorie.', variant: 'error' });
    }
  };

  const handleNameChange = (value: string) => {
    setFormData((currentData) => {
      const nextSlug = currentData.category ? currentData.category : slugifyCategory(value);
      return {
        ...currentData,
        name: value,
        category: nextSlug
      };
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Veuillez sélectionner une image valide.', variant: 'error' });
      return;
    }

    setUploading(true);
    try {
      const compressedFile = await compressImage(file, 1400);
      const uploadKey = formData.category || slugifyCategory(formData.name) || `collection-${Date.now()}`;
      const result = await uploadBrandAsset(compressedFile, `collections/${uploadKey}`);

      if (result.error || !result.data) {
        setToast({ message: result.error || 'Erreur d’upload image.', variant: 'error' });
        return;
      }

      setFormData((currentData) => ({
        ...currentData,
        image_url: result.data || ''
      }));
    } catch (error: unknown) {
      console.error('Erreur upload catégorie:', error);
      setToast({ message: 'Erreur lors de l’upload de l’image.', variant: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.image_url) {
      return;
    }

    const shouldDelete = window.confirm('Supprimer aussi l’image du stockage Supabase ?');
    if (shouldDelete) {
      const result = await deleteImageByUrl(BUCKETS.BRAND_ASSETS, formData.image_url);
      if (result.error) {
        setToast({ message: result.error, variant: 'error' });
        return;
      }
    }

    setFormData((currentData) => ({
      ...currentData,
      image_url: ''
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des catégories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
      <AdminConfirmDialog isOpen={pendingDeleteId !== null} title="Supprimer cette catégorie ?" description="Cette action est irréversible. Vérifiez que cet élément ne doit plus apparaître dans votre boutique." loading={saving} onCancel={() => setPendingDeleteId(null)} onConfirm={() => pendingDeleteId !== null && handleDelete(pendingDeleteId)} />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Collections dynamiques
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Catégories</h1>
          <p className="text-brand-text-muted mt-1">{categories.length} collections dynamiques</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminButton variant="secondary" onClick={() => router.push('/admin')}>
            Retour
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={() => {
              resetForm();
              setNewCategory(true);
            }}
          >
            <Plus size={20} />
            Nouvelle catégorie
          </AdminButton>
        </div>
      </div>

      {(newCategory || editingId) && (
        <AdminCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bebas text-xl text-brand-text uppercase">
              {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>
            <button onClick={resetForm} type="button" className="cursor-pointer" aria-label="Fermer">
              <X size={20} className="text-brand-text" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Nom affiché"
                value={formData.name}
                onChange={handleNameChange}
                required
              />
              <AdminInput
                label="Slug (URL)"
                value={formData.category}
                onChange={(value) => setFormData((currentData) => ({ ...currentData, category: slugifyCategory(value) }))}
                placeholder="basket-pour-homme"
                required
              />
              <AdminInput
                label="Position"
                value={formData.position}
                onChange={(value) => setFormData((currentData) => ({ ...currentData, position: Number(value) || 0 }))}
                type="number"
              />
              <div className="flex items-center gap-4 pt-7">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.visible}
                    onChange={(event) => setFormData((currentData) => ({ ...currentData, visible: event.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-brand-text">Catégorie visible</span>
                </label>
              </div>
            </div>

            <AdminTextarea
              label="Description / accroche"
              value={formData.description}
              onChange={(value) => setFormData((currentData) => ({ ...currentData, description: value }))}
              rows={4}
              placeholder="Décris la collection telle qu’elle doit apparaître sur la vitrine."
            />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id="category-image-upload"
                />
                <label
                  htmlFor="category-image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold text-[#0A0A0A] rounded-lg cursor-pointer hover:bg-brand-gold-light transition-colors font-medium"
                >
                  <Upload size={18} />
                  {uploading ? 'Upload en cours...' : 'Uploader l’image de collection'}
                </label>
                {formData.image_url && (
                  <AdminButton type="button" variant="danger" onClick={handleRemoveImage}>
                    Supprimer l’image
                  </AdminButton>
                )}
              </div>

              {formData.image_url && (
                <div className="relative max-w-sm aspect-video overflow-hidden rounded-xl border border-brand-gold/20 bg-brand-bg">
                  <Image
                    src={formData.image_url}
                    alt="Aperçu de la catégorie"
                    fill
                    sizes="384px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <AdminButton type="submit" variant="primary" loading={saving || uploading}>
                <Save size={16} />
                {editingId ? 'Mettre à jour' : 'Créer'}
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={resetForm}>
                Annuler
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      )}

      {categories.length === 0 ? (
        <AdminEmptyState
          icon={<Tag size={48} />}
          title="Aucune catégorie"
          description="Créez votre première collection dynamique"
          action={
            <AdminButton
              variant="primary"
              onClick={() => {
                resetForm();
                setNewCategory(true);
              }}
            >
              <Plus size={20} />
              Créer une catégorie
            </AdminButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <AdminCard key={category.id} className="p-0 overflow-hidden">
              <div className="relative aspect-video bg-brand-bg">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                    <Tag size={48} />
                  </div>
                )}

                {!category.visible && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-gray-900/90 text-gray-400 text-xs rounded">
                    Caché
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bebas text-lg text-brand-text uppercase">{category.name}</h3>
                  <p className="text-xs text-brand-text-muted">/{category.category}</p>
                </div>

                {category.description && (
                  <p className="text-sm text-brand-text-muted line-clamp-2">{category.description}</p>
                )}

                <div className="text-xs text-brand-text-muted">
                  Position : {category.position}
                </div>

                <div className="flex gap-2 pt-3 border-t border-brand-gold/10">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit size={14} />
                    Modifier
                  </AdminButton>
                  <button
                    onClick={() => handleToggleVisibility(category.id, category.visible)}
                    className="p-2 hover:bg-brand-gold/10 rounded transition-colors cursor-pointer"
                    type="button"
                    aria-label={category.visible ? 'Masquer' : 'Afficher'}
                  >
                    {category.visible ? (
                      <Eye size={16} className="text-brand-text" />
                    ) : (
                      <EyeOff size={16} className="text-brand-text" />
                    )}
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(category.id)}
                    className="p-2 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    type="button"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}