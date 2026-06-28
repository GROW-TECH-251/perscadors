// src/app/admin/hpb/page.tsx
// ============================================
// Gestion des HP Looks (Module HPB) - Vitesse WhatsApp
// ============================================

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminInput, AdminModal } from '@/admin/components';
import { Sparkles, Plus, Edit, Trash2, Check, Eye, EyeOff, Upload, Shirt } from 'lucide-react';
import { fetchAdminOutfits, createOutfit, updateOutfit, deleteOutfit } from '@/services/outfitService';
import { fetchAdminProducts } from '@/services/productService';
import { uploadOutfitImage } from '@/services/mediaService';
import type { AdminOutfit, AdminProduct } from '@/admin/types';

export default function AdminHpbPage() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<AdminOutfit[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États de la modale d'édition / création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState<AdminOutfit | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Recherche interne du Product Picker
  const [pickerSearch, setPickerSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [outfitsData, productsData] = await Promise.all([
        fetchAdminOutfits(),
        fetchAdminProducts()
      ]);
      setOutfits(outfitsData);
      setProducts(productsData);
    } catch (error: unknown) {
      console.error('Erreur chargement HPB:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadData();
    };
    init();
  }, [loadData]);

  // ============================================
  // QUICK INLINE EDITING (Vitesse WhatsApp)
  // ============================================
  const handleToggleVisibility = async (id: number, nextVisible: boolean) => {
    setSavingId(id);
    try {
      setOutfits((currentOutfits) =>
        currentOutfits.map((o) => (o.id === id ? { ...o, visible: nextVisible } : o))
      );
      await updateOutfit(id, { visible: nextVisible });
    } catch (error: unknown) {
      console.error('Erreur bascule visibilité outfit:', error);
      alert('Erreur lors de la mise à jour de la visibilité');
      await loadData();
    } finally {
      setSavingId(null);
    }
  };

  const handleRemoveProductFromOutfit = async (outfitId: number, productIdToRemove: number) => {
    setSavingId(outfitId);
    try {
      const targetOutfit = outfits.find((o) => o.id === outfitId);
      if (!targetOutfit) return;

      const updatedIds = targetOutfit.product_ids.filter((id) => id !== productIdToRemove);
      setOutfits((currentOutfits) =>
        currentOutfits.map((o) => (o.id === outfitId ? { ...o, product_ids: updatedIds } : o))
      );
      await updateOutfit(outfitId, { product_ids: updatedIds });
    } catch (error: unknown) {
      console.error('Erreur retrait produit outfit:', error);
      alert('Erreur lors de la suppression de la pièce');
      await loadData();
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce Look ?')) {
      return;
    }

    try {
      await deleteOutfit(id);
      await loadData();
    } catch (error: unknown) {
      console.error('Erreur suppression outfit:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // ============================================
  // GESTION MODALE & PRODUCT PICKER
  // ============================================
  const handleOpenModal = (outfit?: AdminOutfit) => {
    if (outfit) {
      setEditingOutfit(outfit);
      setName(outfit.name);
      setImageUrl(outfit.image_url);
      setCustomPrice(outfit.custom_price ?? '');
      setSelectedProductIds(outfit.product_ids || []);
    } else {
      setEditingOutfit(null);
      setName('');
      setImageUrl('');
      setCustomPrice('');
      setSelectedProductIds([]);
    }
    setPickerSearch('');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const outfitId = editingOutfit?.id || `temp-${Date.now()}`;
      const result = await uploadOutfitImage(file, outfitId);

      if (result.data) {
        setImageUrl(result.data);
      } else {
        alert(result.error || 'Erreur d’upload de l’image');
      }
    } catch (error: unknown) {
      console.error('Erreur upload image outfit:', error);
      alert('Erreur lors de l’upload de l’image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleProductSelection = (productId: number) => {
    setSelectedProductIds((currentIds) =>
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Le nom du Look est requis.');
      return;
    }
    if (!imageUrl) {
      alert('L’image du Look est requise.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        image_url: imageUrl,
        custom_price: customPrice === '' ? null : Number(customPrice),
        product_ids: selectedProductIds,
        visible: editingOutfit ? editingOutfit.visible : true
      };

      if (editingOutfit?.id) {
        await updateOutfit(editingOutfit.id, payload);
      } else {
        await createOutfit(payload);
      }

      await loadData();
      setIsModalOpen(false);
    } catch (error: unknown) {
      console.error('Erreur sauvegarde outfit:', error);
      alert('Erreur lors de l’enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const filteredOutfits = useMemo(() => {
    return outfits.filter((outfit) =>
      outfit.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [outfits, searchQuery]);

  const filteredPickerProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      product.category.toLowerCase().includes(pickerSearch.toLowerCase())
    );
  }, [products, pickerSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des HP Looks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold border border-brand-gold/20">
            Module HPB • Pilotage Outfits
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">HP Looks de Vioutou</h1>
          <p className="text-brand-text-muted mt-1">{outfits.length} looks synchronisés en direct</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
          <AdminButton variant="primary" onClick={() => handleOpenModal()}>
            <Plus size={20} />
            Nouveau HP Look
          </AdminButton>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <AdminSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un look par nom..."
          className="flex-1"
        />
      </div>

      {filteredOutfits.length === 0 ? (
        <AdminEmptyState
          icon={<Sparkles size={48} />}
          title="Aucun HP Look personnalisé"
          description={searchQuery ? 'Aucun résultat pour cette recherche' : 'Prends en photo ton premier mannequin et crée un Look !'}
          action={
            !searchQuery ? (
              <AdminButton variant="primary" onClick={() => handleOpenModal()}>
                <Plus size={20} />
                Créer mon premier Look
              </AdminButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredOutfits.map((outfit) => {
            const isSaving = savingId === outfit.id;
            const attachedProducts = outfit.product_ids
              .map((id) => products.find((p) => p.id === id))
              .filter(Boolean) as AdminProduct[];

            const calculatedTotal = attachedProducts.reduce((sum, p) => sum + p.price, 0);
            const displayPrice = outfit.custom_price !== null ? outfit.custom_price : calculatedTotal;

            return (
              <AdminCard key={outfit.id} className="p-0 overflow-hidden relative group/outfit border-brand-gold/15 hover:border-brand-gold/40 transition-all shadow-lg hover:shadow-2xl flex flex-col justify-between">
                <div>
                  {/* Image Principale */}
                  <div className="relative w-full aspect-[4/5] bg-brand-bg overflow-hidden">
                    <Image
                      src={outfit.image_url || '/images/LOGOSITE/logo.png'}
                      alt={outfit.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover/outfit:scale-105"
                      unoptimized
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      {!outfit.visible ? (
                        <span className="px-2.5 py-1 bg-gray-900/90 text-gray-400 border border-gray-700 text-xs font-semibold rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                          <EyeOff size={12} /> Caché
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-950/90 text-emerald-400 border border-emerald-800 text-xs font-semibold rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                          <Eye size={12} /> Visible
                        </span>
                      )}
                      {outfit.custom_price !== null && (
                        <span className="px-2.5 py-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/40 text-xs font-semibold rounded-lg backdrop-blur-sm">
                          Prix Spécial Look
                        </span>
                      )}
                    </div>

                    {/* Actions de bascule rapide */}
                    <div className="absolute top-3 right-3 flex gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(outfit.id, !outfit.visible)}
                        disabled={isSaving}
                        className={`p-2.5 rounded-full shadow-lg transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-sm ${
                          outfit.visible
                            ? 'bg-emerald-500 text-[#0A0A0A] hover:bg-emerald-400'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                        title={outfit.visible ? 'Masquer le Look' : 'Rendre visible'}
                      >
                        {outfit.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(outfit.id)}
                        className="p-2.5 bg-red-950/80 text-red-400 hover:bg-red-600 hover:text-white rounded-full shadow-lg transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-sm opacity-0 group-hover/outfit:opacity-100"
                        title="Supprimer le Look"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80 pointer-events-none" />
                  </div>

                  {/* Fiche technique */}
                  <div className="p-5 space-y-4 bg-brand-bg-alt relative z-20">
                    <div>
                      <h3 className="font-bebas text-2xl text-brand-text uppercase leading-tight truncate">
                        {outfit.name}
                      </h3>
                      <p className="text-xs text-brand-text-muted uppercase tracking-widest mt-0.5">
                        {attachedProducts.length} pièce{attachedProducts.length > 1 ? 's' : ''} rattachée{attachedProducts.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Prix */}
                    <div className="flex items-center justify-between py-2 border-y border-brand-gold/10">
                      <span className="font-bebas text-brand-text-muted uppercase tracking-wider text-sm">Prix du Look :</span>
                      <span className="font-bebas text-2xl text-brand-gold font-bold">
                        {displayPrice.toLocaleString()} FCFA
                      </span>
                    </div>

                    {/* Pièces Internes (Quick Unlink) */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-text-muted block">
                        Pièces de l&apos;outfit (Clic sur [×] pour retirer)
                      </span>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {attachedProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between p-2 bg-brand-bg rounded-xl border border-brand-gold/5 group/item"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative w-10 h-10 bg-brand-bg-alt rounded-lg overflow-hidden flex-shrink-0 border border-brand-gold/10">
                                {prod.image_url || prod.images?.[0] ? (
                                  <Image
                                    src={prod.image_url || prod.images[0]}
                                    alt={prod.name}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                                    <Shirt size={16} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bebas text-sm text-brand-text uppercase truncate leading-tight">{prod.name}</p>
                                <p className="text-[10px] text-brand-gold font-bold">{prod.price.toLocaleString()} FCFA</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveProductFromOutfit(outfit.id, prod.id)}
                              disabled={isSaving}
                              className="p-1.5 text-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Retirer cette pièce de l'outfit"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {attachedProducts.length === 0 && (
                          <p className="text-xs text-brand-text-muted italic py-2">Aucun vêtement associé à ce look.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 bg-brand-bg-alt relative z-20">
                  <div className="pt-3 border-t border-brand-gold/10">
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      className="w-full justify-center gap-2"
                      onClick={() => handleOpenModal(outfit)}
                    >
                      <Edit size={14} />
                      Gérer l&apos;Outfit & Ajouter des Pièces
                    </AdminButton>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {/* Modale de Création / Édition avec PRODUCT PICKER */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOutfit ? `Modifier HP Look — ${editingOutfit.name}` : 'Nouveau HP Look de Vioutou'}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <AdminInput
              label="Nom du Look"
              value={name}
              onChange={setName}
              placeholder="Ex: Cargo Explorer 2026"
              required
            />
            <AdminInput
              label="Prix Global Personnalisé (FCFA - Optionnel)"
              value={customPrice}
              onChange={(value) => setCustomPrice(value ? Number(value) : '')}
              type="number"
              placeholder="Laisser vide pour faire la somme des pièces"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-text mb-1">Photo Officielle de l&apos;Outfit</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
                id="outfit-image-upload"
              />
              <label
                htmlFor="outfit-image-upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-[#0A0A0A] rounded-xl cursor-pointer hover:bg-brand-gold-light transition-colors font-medium font-bebas uppercase tracking-wider text-sm shadow-md"
              >
                <Upload size={18} />
                {uploadingImage ? 'Upload de la photo...' : 'Uploader la photo'}
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="p-2 text-red-500 hover:bg-red-950 rounded-lg transition-colors cursor-pointer text-sm font-medium"
                >
                  Supprimer la photo
                </button>
              )}
            </div>

            {imageUrl && (
              <div className="relative w-full max-w-xs aspect-[4/5] bg-brand-bg rounded-2xl overflow-hidden border border-brand-gold/20 mt-4 shadow">
                <Image
                  src={imageUrl}
                  alt="Aperçu Look"
                  fill
                  sizes="320px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>

          {/* SÉLECTEUR DE PRODUITS (PRODUCT PICKER) */}
          <div className="space-y-4 pt-6 border-t border-brand-gold/15">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-bebas text-xl text-brand-gold uppercase tracking-wider">
                  Sélecteur de Produits (Product Picker)
                </label>
                <span className="text-xs text-brand-text-muted bg-brand-bg px-2.5 py-1 rounded-lg border border-brand-gold/10">
                  {selectedProductIds.length} pièce(s) sélectionnée(s)
                </span>
              </div>
              <p className="text-xs text-brand-text-muted mb-4 leading-relaxed">
                Tapote sur les vêtements de ton catalogue pour les associer ou les retirer instantanément de cet outfit.
              </p>
              <AdminSearch
                value={pickerSearch}
                onChange={setPickerSearch}
                placeholder="Filtrer le catalogue par nom ou catégorie..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 bg-brand-bg p-3 rounded-2xl border border-brand-gold/10">
              {filteredPickerProducts.map((prod) => {
                const isSelected = selectedProductIds.includes(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleToggleProductSelection(prod.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-brand-gold/15 border-brand-gold text-brand-text shadow-[0_2px_10px_rgba(184,149,42,0.15)]'
                        : 'bg-brand-bg-alt border-brand-gold/5 text-gray-300 hover:border-brand-gold/30'
                    }`}
                  >
                    <div className="relative w-12 h-12 bg-brand-bg rounded-lg overflow-hidden flex-shrink-0 border border-brand-gold/10">
                      {prod.image_url || prod.images?.[0] ? (
                        <Image
                          src={prod.image_url || prod.images[0]}
                          alt={prod.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                          <Shirt size={18} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bebas text-base uppercase truncate leading-tight ${isSelected ? 'text-brand-gold font-bold' : 'text-brand-text'}`}>
                        {prod.name}
                      </p>
                      <p className="text-xs text-brand-text-muted mt-0.5">{prod.price.toLocaleString()} FCFA</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-brand-gold border-brand-gold text-[#0A0A0A]' : 'border-gray-600 bg-transparent'
                    }`}>
                      {isSelected && <Check size={14} className="stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
              {filteredPickerProducts.length === 0 && (
                <div className="col-span-2 text-center py-8 text-brand-text-muted text-sm">
                  Aucun vêtement trouvé pour cette recherche.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-brand-gold/15">
            <AdminButton type="submit" variant="primary" loading={saving} className="flex-1">
              {editingOutfit ? 'Mettre à jour l’Outfit' : 'Créer l’Outfit'}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
