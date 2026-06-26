// src/admin/screens/CategoriesScreen.tsx
// ============================================
// Écran de gestion des catégories
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { AdminCard, AdminButton, AdminInput, AdminEmptyState } from '../components';
import { Tag, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import type { AdminCategory } from '@/admin/types';

interface CategoriesScreenProps {
  onBack: () => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ onBack }) => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    visible: true,
    order: 0
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
    const loadData = async () => {
      await loadCategories();
    };
    loadData();
  }, [loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory?.id) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory({
          ...formData,
          order: categories.length
        });
      }
      await loadCategories();
      resetForm();
    } catch (err: unknown) {
      console.error('Erreur sauvegarde catégorie:', err);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      visible: category.visible,
      order: category.order
    });
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    try {
      await deleteCategory(id);
      await loadCategories();
      resetForm();
    } catch (err: unknown) {
      console.error('Erreur suppression catégorie:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setIsCreating(false);
    setFormData({
      name: '',
      slug: '',
      description: '',
      visible: true,
      order: 0
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
            Catégories
          </h1>
          <p className="text-brand-text-muted mt-1">
            {categories.length} catégorie{categories.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <AdminButton variant="secondary" onClick={onBack}>
            Retour
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
          >
            <Plus size={20} />
            Nouvelle catégorie
          </AdminButton>
        </div>
      </div>

      {/* Form */}
      {(isCreating || editingCategory) && (
        <AdminCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bebas text-xl text-brand-text uppercase">
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>
            <button onClick={resetForm} className="cursor-pointer" aria-label="Fermer">
              <X size={20} className="text-brand-text" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Nom"
                value={formData.name}
                onChange={(v) => setFormData({ ...formData, name: v })}
                required
              />
              <AdminInput
                label="Slug (URL)"
                value={formData.slug}
                onChange={(v) => setFormData({ ...formData, slug: v })}
                placeholder="ma-categorie"
                required
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
                {editingCategory ? 'Mettre à jour' : 'Créer'}
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
            <AdminButton variant="primary" onClick={() => setIsCreating(true)}>
              <Plus size={20} />
              Créer une catégorie
            </AdminButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <AdminCard key={category.id} className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-gold/10 rounded-lg">
                    <Tag size={20} className="text-brand-gold" />
                  </div>
                  <div>
                    <h3 className="font-bebas text-lg text-brand-text uppercase">
                      {category.name}
                    </h3>
                    <p className="text-xs text-brand-text-muted">{category.slug}</p>
                  </div>
                </div>
                {!category.visible && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                    Caché
                  </span>
                )}
              </div>

              {category.description && (
                <p className="text-sm text-brand-text-muted mb-4">{category.description}</p>
              )}

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
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
};