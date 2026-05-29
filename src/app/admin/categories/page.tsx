// src/app/admin/categories/page.tsx
// ============================================
// Gestion des Catégories
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminInput, AdminEmptyState } from '@/admin/components';
import { Tag, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { fetchCategories, updateCategory, deleteCategory, createCategory } from '@/services/categoryService';
import type { AdminCategory } from '@/admin/types';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    image_url: '',
    visible: true,
    position: 0
  });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err: unknown) {
      console.error('Erreur chargement catégories:', err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateCategory(editingId, formData);
        alert('Catégorie mise à jour !');
      } else {
        await createCategory(formData);
        alert('Catégorie créée !');
      }
      await loadCategories();
      resetForm();
    } catch (err: unknown) {
      alert('Erreur lors de la sauvegarde');
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
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (err: unknown) {
      alert('Erreur suppression');
    }
  };

  const handleToggleVisibility = async (id: number, currentVisible: boolean) => {
    try {
      await updateCategory(id, { visible: !currentVisible });
      await loadCategories();
    } catch (err: unknown) {
      alert('Erreur mise à jour');
    }
  };

  const resetForm = () => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Catégories</h1>
          <p className="text-brand-text-muted mt-1">{categories.length} catégories</p>
        </div>
        <div className="flex gap-3">
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

      {/* Form */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Nom affiché"
                value={formData.name}
                onChange={(v) => setFormData({ ...formData, name: v })}
                required
              />
              <AdminInput
                label="Slug (URL)"
                value={formData.category}
                onChange={(v) => setFormData({ ...formData, category: v })}
                placeholder="basket-pour-homme"
                required
              />
              <AdminInput
                label="URL de l'image"
                value={formData.image_url}
                onChange={(v) => setFormData({ ...formData, image_url: v })}
                placeholder="/images/ARTICLES/..."
              />
              <AdminInput
                label="Position"
                value={formData.position}
                onChange={(v) => setFormData({ ...formData, position: Number(v) || 0 })}
                type="number"
              />
            </div>

            <AdminInput
              label="Description"
              value={formData.description}
              onChange={(v) => setFormData({ ...formData, description: v })}
              placeholder="Description de la catégorie..."
            />

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.visible}
                  onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-brand-text">Catégorie visible</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <AdminButton type="submit" variant="primary">
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

      {/* Categories List */}
      {categories.length === 0 ? (
        <AdminEmptyState
          icon={<Tag size={48} />}
          title="Aucune catégorie"
          description="Créez votre première catégorie"
          action={
            <AdminButton variant="primary" onClick={() => { resetForm(); setNewCategory(true); }}>
              <Plus size={20} />
              Créer une catégorie
            </AdminButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <AdminCard key={category.id} className="p-0 overflow-hidden">
              {/* Image */}
              <div className="relative aspect-video bg-brand-bg">
                {category.image_url ? (
                  <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                    <Tag size={48} />
                  </div>
                )}

                {!category.visible && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
                    Caché
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bebas text-lg text-brand-text uppercase">{category.name}</h3>
                  <p className="text-xs text-brand-text-muted">/{category.category}</p>
                </div>

                {category.description && (
                  <p className="text-sm text-brand-text-muted line-clamp-2">{category.description}</p>
                )}

                {/* Actions */}
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
                    onClick={() => handleDelete(category.id)}
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