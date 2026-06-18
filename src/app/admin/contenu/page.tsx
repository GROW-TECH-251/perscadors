// src/app/admin/contenu/page.tsx
// ============================================
// Gestion des contenus dynamiques
// ============================================

'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminInput, AdminTextarea, AdminSelect, AdminSearch, AdminEmptyState, AdminBadge } from '@/admin/components';
import { FileText, Plus, Edit, Trash2, Upload, Send, Clock3 } from 'lucide-react';
import {
  createContentPost,
  deleteContentPost,
  fetchContentPosts,
  togglePostPublication,
  updateContentPost,
  type ContentPostFormData
} from '@/services/contentService';
import { BUCKETS, compressImage, deleteImageByUrl, uploadContentImage } from '@/services/mediaService';
import type { ContentPost, ContentPostType } from '@/admin/types';

const STATUS_OPTIONS: Array<{ value: ContentPost['status']; label: string }> = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'scheduled', label: 'Planifié' }
];

const CATEGORY_OPTIONS: Array<{ value: ContentPostType; label: string }> = [
  { value: 'Arrivage', label: 'Arrivage' },
  { value: 'Promotion', label: 'Promotion' },
  { value: 'Nouveauté', label: 'Nouveauté' },
  { value: 'Annonce', label: 'Annonce' }
];

interface ContentFormState {
  title: string;
  content: string;
  image_url: string;
  category: ContentPostType;
  status: ContentPost['status'];
  scheduled_at: string;
}

function getStatusBadgeVariant(status: ContentPost['status']): 'warning' | 'success' | 'info' {
  switch (status) {
    case 'published':
      return 'success';
    case 'scheduled':
      return 'info';
    default:
      return 'warning';
  }
}

function formatDateTimeForInput(value: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 16);
}

function buildPostUploadKey(postId?: string | null): string {
  return postId || `content-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
}

export default function AdminContentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentPost['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ContentPostType | 'all'>('all');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [uploadKey, setUploadKey] = useState(buildPostUploadKey());
  const [formData, setFormData] = useState<ContentFormState>({
    title: '',
    content: '',
    image_url: '',
    category: 'Arrivage',
    status: 'draft',
    scheduled_at: ''
  });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchContentPosts();
      setPosts(data);
    } catch (error: unknown) {
      console.error('Erreur chargement contenus:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadPosts();
    };

    init();
  }, [loadPosts]);

  const resetForm = () => {
    setEditingPostId(null);
    setUploadKey(buildPostUploadKey());
    setFormData({
      title: '',
      content: '',
      image_url: '',
      category: 'Arrivage',
      status: 'draft',
      scheduled_at: ''
    });
    setFormOpen(false);
  };

  const handleCreateMode = () => {
    setEditingPostId(null);
    setUploadKey(buildPostUploadKey());
    setFormData({
      title: '',
      content: '',
      image_url: '',
      category: 'Arrivage',
      status: 'draft',
      scheduled_at: ''
    });
    setFormOpen(true);
  };

  const handleEditMode = (post: ContentPost) => {
    setEditingPostId(post.id);
    setUploadKey(buildPostUploadKey(post.id));
    setFormData({
      title: post.title,
      content: post.content,
      image_url: post.image_url || '',
      category: post.category,
      status: post.status,
      scheduled_at: formatDateTimeForInput(post.scheduled_at)
    });
    setFormOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    setUploading(true);
    try {
      const compressedFile = await compressImage(file, 1200);
      const result = await uploadContentImage(compressedFile, uploadKey);

      if (result.error || !result.data) {
        alert(result.error || 'Erreur upload image');
        return;
      }

      setFormData((currentData) => ({
        ...currentData,
        image_url: result.data || ''
      }));
    } catch (error: unknown) {
      console.error('Erreur upload contenu:', error);
      alert('Erreur lors de l’upload de l’image');
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
      const result = await deleteImageByUrl(BUCKETS.CONTENT_IMAGES, formData.image_url);
      if (result.error) {
        alert(result.error);
        return;
      }
    }

    setFormData((currentData) => ({
      ...currentData,
      image_url: ''
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.status === 'scheduled' && !formData.scheduled_at) {
      alert('Veuillez choisir une date de planification.');
      return;
    }

    setSaving(true);

    const payload: ContentPostFormData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      image_url: formData.image_url || null,
      category: formData.category,
      status: formData.status,
      published_at: formData.status === 'published' ? new Date().toISOString() : null,
      scheduled_at: formData.status === 'scheduled' ? new Date(formData.scheduled_at).toISOString() : null
    };

    try {
      const result = editingPostId
        ? await updateContentPost(editingPostId, payload)
        : await createContentPost(payload);

      if (result.error) {
        alert(result.error);
        return;
      }

      await loadPosts();
      resetForm();
    } catch (error: unknown) {
      console.error('Erreur sauvegarde contenu:', error);
      alert('Erreur lors de la sauvegarde du contenu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: ContentPost) => {
    if (!window.confirm(`Supprimer le post "${post.title}" ?`)) {
      return;
    }

    try {
      const result = await deleteContentPost(post.id);
      if (result.error) {
        alert(result.error);
        return;
      }

      await loadPosts();
    } catch (error: unknown) {
      console.error('Erreur suppression contenu:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleQuickToggleStatus = async (post: ContentPost) => {
    const nextStatus: ContentPost['status'] = post.status === 'published' ? 'draft' : 'published';

    try {
      const result = await togglePostPublication(post.id, nextStatus);
      if (result.error) {
        alert(result.error);
        return;
      }

      await loadPosts();
    } catch (error: unknown) {
      console.error('Erreur publication contenu:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
      const matchesType = typeFilter === 'all' || post.category === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [posts, searchQuery, statusFilter, typeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des contenus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Storytelling boutique
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Contenu</h1>
          <p className="text-brand-text-muted mt-1">{posts.length} contenus dynamiques</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
          <AdminButton variant="primary" onClick={handleCreateMode}>
            <Plus size={18} />
            Nouveau contenu
          </AdminButton>
        </div>
      </div>

      {formOpen && (
        <AdminCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase">
              {editingPostId ? 'Modifier le contenu' : 'Créer un contenu'}
            </h2>
            <AdminButton variant="secondary" onClick={resetForm}>Fermer</AdminButton>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminInput
                label="Titre"
                value={formData.title}
                onChange={(value) => setFormData((currentData) => ({ ...currentData, title: value }))}
                required
              />
              <AdminSelect
                label="Type"
                value={formData.category}
                onChange={(value) => setFormData((currentData) => ({ ...currentData, category: value as ContentPostType }))}
                options={CATEGORY_OPTIONS}
              />
              <AdminSelect
                label="Statut"
                value={formData.status}
                onChange={(value) => setFormData((currentData) => ({ ...currentData, status: value as ContentPost['status'] }))}
                options={STATUS_OPTIONS}
              />
              <AdminInput
                label="Planification"
                type="text"
                value={formData.scheduled_at}
                onChange={(value) => setFormData((currentData) => ({ ...currentData, scheduled_at: value }))}
                placeholder="AAAA-MM-JJTHH:MM (optionnel si planifié)"
              />
            </div>

            <AdminTextarea
              label="Contenu"
              value={formData.content}
              onChange={(value) => setFormData((currentData) => ({ ...currentData, content: value }))}
              rows={8}
              required
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
                  id="content-image-upload"
                />
                <label
                  htmlFor="content-image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold text-[#0A0A0A] rounded-lg cursor-pointer hover:bg-brand-gold-light transition-colors font-medium"
                >
                  <Upload size={18} />
                  {uploading ? 'Upload en cours...' : 'Uploader une image'}
                </label>

                {formData.image_url && (
                  <AdminButton variant="danger" type="button" onClick={handleRemoveImage}>
                    Supprimer l’image
                  </AdminButton>
                )}
              </div>

              {formData.image_url && (
                <div className="relative w-full max-w-sm aspect-video overflow-hidden rounded-xl border border-brand-gold/20 bg-brand-bg">
                  <Image
                    src={formData.image_url}
                    alt="Aperçu du contenu"
                    fill
                    sizes="384px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <AdminButton type="submit" variant="primary" loading={saving || uploading}>
                <Send size={16} />
                {editingPostId ? 'Mettre à jour' : 'Publier le contenu'}
              </AdminButton>
              <AdminButton type="button" variant="secondary" onClick={resetForm}>
                Annuler
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <AdminSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un contenu..."
          className="flex-1"
        />
        <AdminSelect
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as ContentPost['status'] | 'all')}
          options={[
            { value: 'all', label: 'Tous les statuts' },
            ...STATUS_OPTIONS
          ]}
          className="lg:w-56"
        />
        <AdminSelect
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as ContentPostType | 'all')}
          options={[
            { value: 'all', label: 'Tous les types' },
            ...CATEGORY_OPTIONS
          ]}
          className="lg:w-56"
        />
      </div>

      {filteredPosts.length === 0 ? (
        <AdminEmptyState
          icon={<FileText size={48} />}
          title="Aucun contenu"
          description="Créez votre premier post dynamique pour alimenter la vitrine."
          action={
            <AdminButton variant="primary" onClick={handleCreateMode}>
              <Plus size={20} />
              Créer un contenu
            </AdminButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <AdminCard key={post.id} className="p-0 overflow-hidden">
              <div className="relative aspect-video bg-brand-bg">
                {post.image_url ? (
                  <Image
                    src={post.image_url}
                    alt={post.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                    <FileText size={40} />
                  </div>
                )}
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bebas text-lg text-brand-text uppercase leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-xs text-brand-text-muted mt-1">{post.category}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <AdminBadge variant={getStatusBadgeVariant(post.status)}>{post.status}</AdminBadge>
                    {post.status === 'scheduled' && <Clock3 size={14} className="text-brand-gold" />}
                  </div>
                </div>

                <p className="text-sm text-brand-text-muted line-clamp-3">
                  {post.content}
                </p>

                <div className="text-xs text-brand-text-muted">
                  Mis à jour le {new Date(post.updated_at).toLocaleDateString('fr-FR')}
                </div>

                <div className="flex gap-2 flex-wrap pt-3 border-t border-brand-gold/10">
                  <AdminButton variant="secondary" size="sm" onClick={() => handleEditMode(post)}>
                    <Edit size={14} />
                    Modifier
                  </AdminButton>
                  <AdminButton
                    variant={post.status === 'published' ? 'secondary' : 'success'}
                    size="sm"
                    onClick={() => handleQuickToggleStatus(post)}
                  >
                    {post.status === 'published' ? 'Dépublier' : 'Publier'}
                  </AdminButton>
                  <button
                    type="button"
                    onClick={() => handleDelete(post)}
                    className="p-2 hover:bg-red-50 rounded transition-colors cursor-pointer"
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