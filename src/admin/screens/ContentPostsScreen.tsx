// src/admin/screens/ContentPostsScreen.tsx
// ============================================
// Écran de gestion du contenu / actualités
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { AdminCard, AdminButton, AdminEmptyState, AdminInput, AdminTextarea, AdminSelect } from '../components';
import { FileText, Plus, Edit, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import { fetchContentPosts, createContentPost, updateContentPost, deleteContentPost } from '@/services/contentService';
import type { ContentPost, ContentPostType } from '@/admin/types';

interface ContentPostsScreenProps {
  onBack: () => void;
}

export const ContentPostsScreen: React.FC<ContentPostsScreenProps> = ({ onBack }) => {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    type: 'news' as ContentPostType,
    content: '',
    excerpt: '',
    image: '',
    published: false
  });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchContentPosts();
      setPosts(data);
    } catch (err: unknown) {
      console.error('Erreur chargement posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadPosts();
    };
    load();
  }, [loadPosts]);

  const resetForm = () => {
    setEditingPost(null);
    setIsEditing(false);
    setFormData({
      title: '',
      slug: '',
      type: 'news',
      content: '',
      excerpt: '',
      image: '',
      published: false
    });
  };

  const handleEdit = (post: ContentPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug || post.id || '',
      type: post.type || post.category || 'news',
      content: post.content,
      excerpt: post.excerpt || '',
      image: post.image || post.image_url || '',
      published: post.published ?? (post.status === 'published')
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce post ?')) return;

    try {
      await deleteContentPost(id);
      await loadPosts();
      resetForm();
    } catch (err: unknown) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPost?.id) {
        await updateContentPost(editingPost.id, formData);
      } else {
        await createContentPost({
          ...formData,
          author: 'Admin',
          category: formData.type,
          status: formData.published ? 'published' : 'draft'
        });
      }
      await loadPosts();
      resetForm();
    } catch (err: unknown) {
      console.error('Erreur sauvegarde:', err);
      alert('Erreur lors de la sauvegarde');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement...</p>
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
            Contenu & Actualités
          </h1>
          <p className="text-brand-text-muted mt-1">
            {posts.length} post{posts.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <AdminButton variant="secondary" onClick={onBack}>
            Retour
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={() => setIsEditing(true)}
          >
            <Plus size={20} />
            Nouveau post
          </AdminButton>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <AdminCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bebas text-xl text-brand-text uppercase">
              {editingPost ? 'Modifier le post' : 'Nouveau post'}
            </h2>
            <button onClick={resetForm} className="cursor-pointer" aria-label="Fermer">
              <X size={20} className="text-brand-text" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Titre"
                value={formData.title}
                onChange={(v) => setFormData({ ...formData, title: v })}
                required
              />
              <AdminInput
                label="Slug"
                value={formData.slug}
                onChange={(v) => setFormData({ ...formData, slug: v })}
                placeholder="mon-article"
                required
              />
            </div>

            <AdminSelect
              label="Type"
              value={formData.type}
              onChange={(v) => setFormData({ ...formData, type: v as ContentPostType })}
              options={[
                { value: 'news', label: 'Actualité' },
                { value: 'blog', label: 'Blog' },
                { value: 'announcement', label: 'Annonce' }
              ]}
            />

            <AdminInput
              label="Extrait"
              value={formData.excerpt}
              onChange={(v) => setFormData({ ...formData, excerpt: v })}
              placeholder="Court résumé..."
            />

            <AdminInput
              label="Image URL"
              value={formData.image}
              onChange={(v) => setFormData({ ...formData, image: v })}
              placeholder="https://..."
            />

            <AdminTextarea
              label="Contenu"
              value={formData.content}
              onChange={(v) => setFormData({ ...formData, content: v })}
              rows={8}
              required
            />

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-brand-text">Publié</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <AdminButton type="submit" variant="primary">
                <Save size={16} />
                {editingPost ? 'Mettre à jour' : 'Créer'}
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={resetForm}>
                Annuler
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <AdminEmptyState
          icon={<FileText size={48} />}
          title="Aucun contenu"
          description="Créez votre premier post"
          action={
            <AdminButton variant="primary" onClick={() => setIsEditing(true)}>
              <Plus size={20} />
              Créer un post
            </AdminButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const displayImage = post.image || post.image_url;
            const isPublished = post.published ?? (post.status === 'published');
            return (
              <AdminCard key={post.id} className="p-0 overflow-hidden">
                {displayImage && (
                  <div className="aspect-video bg-brand-bg">
                    <img src={displayImage} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-brand-gold uppercase tracking-wider">
                        {post.type || post.category}
                      </span>
                      <h3 className="font-bebas text-lg text-brand-text uppercase mt-1">
                        {post.title}
                      </h3>
                    </div>
                    {isPublished ? (
                      <Eye size={16} className="text-green-500" />
                    ) : (
                      <EyeOff size={16} className="text-gray-400" />
                    )}
                  </div>

                  {post.excerpt && (
                    <p className="text-sm text-brand-text-muted line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}

                  <p className="text-xs text-brand-text-muted">
                    {new Date(post.created_at).toLocaleDateString('fr-FR')}
                  </p>

                  <div className="flex gap-2 pt-3 border-t border-brand-gold/10">
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(post)}
                    >
                      <Edit size={14} />
                      Modifier
                    </AdminButton>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
