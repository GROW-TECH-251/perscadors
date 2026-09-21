// src/app/admin/hpb/page.tsx
// ============================================
// Gestion des HP Looks (Module HPB) - Vitesse WhatsApp
// ============================================

'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminInput, AdminModal, AdminToast, AdminConfirmDialog } from '@/admin/components';
import { Sparkles, Plus, Edit, Trash2, Check, Eye, EyeOff, Upload, Shirt, MessageCircle, AlertTriangle, Video, Layers } from 'lucide-react';
import { fetchAdminOutfits, createOutfit, updateOutfit, deleteOutfit } from '@/services/outfitService';
import { fetchAdminProducts } from '@/services/productService';
import { shareMediaToWhatsAppStatus } from '@/services/whatsappShareService';
import { WhatsAppRecipientDialog } from '@/components/admin/WhatsAppRecipientDialog';
import { fetchShopSettings, formatWhatsAppMessage, getDefaultShopSettings } from '@/services/settingsService';
import { isBreakdownAmountValid } from '@/lib/breakdownValidation';
import { openWhatsApp } from '@/services/whatsappService';
import type { CustomerSummary } from '@/admin/types';
import { uploadOutfitImage, uploadOutfitVideo, deleteOutfitVideo } from '@/services/mediaService';
import type { AdminOutfit, AdminProduct } from '@/admin/types';

export default function AdminHpbPage() {
  const router = useRouter();
  const [outfits, setOutfits] = useState<AdminOutfit[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingShareOutfit, setPendingShareOutfit] = useState<{ outfit: AdminOutfit; price: number } | null>(null);
  const [settings, setSettings] = useState(getDefaultShopSettings());
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États de la modale d'édition / création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState<AdminOutfit | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  // IMPL-3 (C3) — prix forfaitaire HP Look : 2 modes mutuellement exclusifs.
  const [pricingMode, setPricingMode] = useState<'calculated' | 'flat'>('calculated');
  const [flatPrice, setFlatPrice] = useState('');
  // IMPL-4 (C3+C4) — décomposition du forfait : lignes libres libellé + montant.
  const [priceLines, setPriceLines] = useState<{ label: string; amount: string }[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  // IMPL-C (UI Boost) — vidéo optionnelle du look (Cloudinary).
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPublicId, setVideoPublicId] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  // IMPL-3 (C3) — somme des pièces sélectionnées (articles masqués inclus :
  // le trigger Supabase recalcule sur TOUS les product_ids).
  const calculatedSum = useMemo(
    () => selectedProductIds.reduce((sum, id) => sum + (products.find((p) => p.id === id)?.price ?? 0), 0),
    [selectedProductIds, products]
  );

  // IMPL-4 — lignes réellement remplies + somme indicative (le forfait reste
  // la référence : la somme des lignes n'est jamais imposée).
  const filledLinesCount = priceLines.filter((line) => line.label.trim() !== '' || line.amount.trim() !== '').length;
  const breakdownSum = useMemo(
    () => priceLines.reduce((sum, line) => sum + (Number.isFinite(Number(line.amount)) ? Number(line.amount) : 0), 0),
    [priceLines]
  );

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
      const result = await updateOutfit(id, { visible: nextVisible });
      if (result.error) throw new Error(result.error);
    } catch (error: unknown) {
      console.error('Erreur bascule visibilité outfit:', error);
      setToast({ message: 'Impossible de mettre à jour la visibilité du look.', variant: 'error' });
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
      const result = await updateOutfit(outfitId, { product_ids: updatedIds });
      if (result.error) throw new Error(result.error);
    } catch (error: unknown) {
      console.error('Erreur retrait produit outfit:', error);
      setToast({ message: 'Impossible de retirer cette pièce du look.', variant: 'error' });
      await loadData();
    } finally {
      setSavingId(null);
    }
  };

  const shareOutfitStatus = async (outfit: AdminOutfit) => {
    if (!outfit.image_url) { setToast({ message: 'Ce HP Look ne possède pas encore d’image à partager.', variant: 'error' }); return; }
    const result = await shareMediaToWhatsAppStatus(outfit.image_url, outfit.name);
    setToast({ message: result.message || 'Choisissez WhatsApp puis Statut pour publier le look.', variant: result.shared ? 'success' : 'info' });
  };

  const sendOutfitToCustomer = async (customer: CustomerSummary) => {
    if (!pendingShareOutfit) return;
    const currentSettings = await fetchShopSettings() || settings;
    setSettings(currentSettings);
    const message = formatWhatsAppMessage(currentSettings.outfit_share_template, {
      shopName: currentSettings.shop_name,
      clientName: customer.name,
      lookName: pendingShareOutfit.outfit.name,
      lookPrice: `${pendingShareOutfit.price.toLocaleString()} FCFA`
    });
    openWhatsApp(message, customer.phone);
    setToast({ message: `Message HP Look préparé pour ${customer.name}.`, variant: 'success' });
    setPendingShareOutfit(null);
  };

  const handleDelete = async (id: number) => {
    setPendingDeleteId(null);
    try {
      const result = await deleteOutfit(id);
      if (result.error) throw new Error(result.error);
      await loadData();
    } catch (error: unknown) {
      console.error('Erreur suppression outfit:', error);
      setToast({ message: 'Impossible de supprimer ce look pour le moment.', variant: 'error' });
    }
  };

  // ============================================
  // GESTION MODALE & PRODUCT PICKER
  // ============================================
  const handleOpenModal = (outfit?: AdminOutfit) => {
    if (outfit) {
      setEditingOutfit(outfit);
      setName(outfit.name);
      setPosition(outfit.position != null ? String(outfit.position) : '');
      setImageUrl(outfit.image_url);
      setSelectedProductIds(outfit.product_ids || []);
      setPricingMode(outfit.pricing_mode === 'flat' ? 'flat' : 'calculated');
      setFlatPrice(outfit.pricing_mode === 'flat' && outfit.custom_price !== null ? String(outfit.custom_price) : '');
      setPriceLines(
        (outfit.price_breakdown || []).map((line) => ({
          label: line?.label ?? '',
          amount: line && line.amount != null ? String(line.amount) : ''
        }))
      );
      setShowBreakdown(Boolean(outfit.show_price_breakdown));
      setVideoUrl(outfit.video_url || null);
      setVideoPublicId(outfit.video_public_id || null);
    } else {
      setEditingOutfit(null);
      setName('');
      setPosition('');
      setImageUrl('');
      setSelectedProductIds([]);
      setPricingMode('calculated');
      setFlatPrice('');
      setPriceLines([]);
      setShowBreakdown(false);
      setVideoUrl(null);
      setVideoPublicId(null);
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
        setToast({ message: result.error || 'Erreur d’upload de l’image.', variant: 'error' });
      }
    } catch (error: unknown) {
      console.error('Erreur upload image outfit:', error);
      setToast({ message: 'Erreur lors de l’upload de l’image.', variant: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  // IMPL-C — upload vidéo du look : mêmes règles que les produits
  // (MIME video/* + .mp4/.mov/.webm, 30 Mo max, MP4 H.264 recommandé).
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
      const result = await uploadOutfitVideo(file, editingOutfit?.id ?? 'draft');
      if (result.error || !result.url) {
        setToast({ message: result.error || 'Erreur d’upload vidéo.', variant: 'error' });
      } else {
        if (videoPublicId) {
          void deleteOutfitVideo(videoPublicId);
        }
        setVideoUrl(result.url);
        setVideoPublicId(result.publicId);
        setToast({ message: 'Vidéo ajoutée au look.', variant: 'success' });
      }
    } catch (error: unknown) {
      console.error('Erreur upload vidéo look:', error);
      setToast({ message: 'Erreur lors de l’upload de la vidéo.', variant: 'error' });
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveVideo = () => {
    if (videoPublicId) {
      void deleteOutfitVideo(videoPublicId);
    }
    setVideoUrl(null);
    setVideoPublicId(null);
    setToast({ message: 'Vidéo retirée du look.', variant: 'info' });
  };

  const handleToggleProductSelection = (productId: number) => {
    setSelectedProductIds((currentIds) =>
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId]
    );
  };

  // IMPL-3 (C3) : bascule de mode avec avertissement — les deux sens ont une
  // conséquence (forfait figé / forfait remplacé par la somme des pièces).
  const switchPricingMode = (next: 'calculated' | 'flat') => {
    if (next === pricingMode) return;
    const message = next === 'flat'
      ? 'Passer au prix forfaitaire ?\n\nLe prix ne sera plus recalculé automatiquement quand tu modifieras les pièces du look : il restera fixe jusqu\u2019à ta prochaine décision.'
      : 'Revenir au prix calculé ?\n\nLe prix forfaitaire actuel sera définitivement remplacé par la somme des pièces du look.';
    if (!window.confirm(message)) return;
    // Pré-remplissage pratique : la somme actuelle comme point de départ.
    if (next === 'flat' && flatPrice.trim() === '' && calculatedSum > 0) {
      setFlatPrice(String(calculatedSum));
    }
    setPricingMode(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ message: 'Le nom du look est requis.', variant: 'error' });
      return;
    }
    if (!imageUrl) {
      setToast({ message: 'L’image du look est requise.', variant: 'error' });
      return;
    }
    if (pricingMode === 'flat' && (!Number.isFinite(Number(flatPrice)) || Number(flatPrice) <= 0)) {
      setToast({ message: 'Prix forfaitaire invalide : indique un nombre supérieur à 0.', variant: 'error' });
      return;
    }
    // IMPL-4 — lignes de décomposition complètes ou vides, jamais à moitié.
    const filledLines = priceLines.filter((line) => line.label.trim() !== '' || line.amount.trim() !== '');
    if (
      pricingMode === 'flat' &&
      // Lot 4 — validateur miroir de la contrainte SQL RÉELLE (vérifiée PG 17) :
      // montants ENTIERS positifs uniquement (FCFA sans sous-unité) — refuse
      // vide, non-numérique, <= 0, décimales et notations scientifiques
      // (« 12.5 », « 1e-7 »…) que la base rejette : plus d'erreur brute.
      filledLines.some((line) => line.label.trim() === '' || !isBreakdownAmountValid(line.amount))
    ) {
      setToast({ message: 'Décomposition incomplète : chaque ligne doit avoir un libellé et un montant (entier positif en FCFA).', variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        // Phase finale 09/2026 (E1) — ordre d'affichage public (1 = premier, vide = fin de liste).
        position: position.trim() === '' ? null : Number(position),
        image_url: imageUrl,
        // IMPL-3 (C3) — 2 modes mutuellement exclusifs : forfait = référence
        // (custom_price manuel, préservé par le trigger v2), calculé = somme
        // des pièces recalculée par le trigger Supabase.
        pricing_mode: pricingMode,
        custom_price: pricingMode === 'flat' ? Number(flatPrice) : null,
        // IMPL-4 (C3+C4) — décomposition libre du forfait (jamais des articles
        // catalogue) + interrupteur d'affichage public par look. Les lignes
        // saisies sont conservées même hors mode forfait (non affichées).
        price_breakdown: filledLines.length > 0 ? filledLines.map((line) => ({ label: line.label.trim(), amount: Number(line.amount) })) : null,
        show_price_breakdown: pricingMode === 'flat' && showBreakdown && filledLines.length > 0,
        // IMPL-C — vidéo optionnelle du look.
        video_url: videoUrl,
        video_public_id: videoPublicId,
        product_ids: selectedProductIds,
        visible: editingOutfit ? editingOutfit.visible : true
      };

      const result = editingOutfit?.id
        ? await updateOutfit(editingOutfit.id, payload)
        : await createOutfit(payload);
      if (result.error || !result.data) {
        setToast({ message: result.error || 'Impossible d’enregistrer ce look sur le serveur.', variant: 'error' });
        return;
      }
      await loadData();
      setIsModalOpen(false);
      setToast({ message: editingOutfit ? 'HP Look mis à jour.' : 'HP Look créé et synchronisé.', variant: 'success' });
    } catch (error: unknown) {
      console.error('Erreur sauvegarde outfit:', error);
      setToast({ message: 'Impossible d’enregistrer ce look pour le moment.', variant: 'error' });
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
      {toast && <AdminToast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
      <WhatsAppRecipientDialog isOpen={pendingShareOutfit !== null} title={`Envoyer ${pendingShareOutfit?.outfit.name || 'le HP Look'} à un client`} onClose={() => setPendingShareOutfit(null)} onSelect={sendOutfitToCustomer} />
      <AdminConfirmDialog isOpen={pendingDeleteId !== null} title="Supprimer ce look ?" description="Ce look, son image et ses associations de produits seront retirés. Cette action est irréversible." loading={pendingDeleteId ? savingId === pendingDeleteId : false} onCancel={() => setPendingDeleteId(null)} onConfirm={() => pendingDeleteId !== null && handleDelete(pendingDeleteId)} />

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
          {filteredOutfits.map((outfit) => {
            const isSaving = savingId === outfit.id;
            const attachedProducts = outfit.product_ids
              .map((id) => products.find((p) => p.id === id))
              .filter(Boolean) as AdminProduct[];

            const calculatedTotal = attachedProducts.reduce((sum, p) => sum + p.price, 0);
            const displayPrice = outfit.custom_price !== null ? outfit.custom_price : calculatedTotal;
            // Lot 3 — décomposition du look : le résumé de liste s'affiche dès
            // qu'elle existe ; l'interrupteur public ne concerne que la vitrine.
            const breakdown = outfit.price_breakdown ?? [];

            return (
              <AdminCard key={outfit.id} className="p-0 overflow-hidden relative group/outfit border-brand-gold/15 hover:border-brand-gold/40 transition-all shadow-lg hover:shadow-2xl flex flex-col justify-between">
                <div>
                  {/* Image Principale */}
                  <div className="relative w-full aspect-[4/5] bg-brand-bg overflow-hidden">
                    <Image
                      src={outfit.image_url || '/assets/brand/logo.png'}
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
                      {(attachedProducts.length === 0 || !outfit.image_url) && (
                        <span className="px-2.5 py-1 bg-amber-950/90 text-amber-400 border border-amber-800 text-xs font-semibold rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                          <AlertTriangle size={12} /> À compléter
                        </span>
                      )}
                      {outfit.pricing_mode === 'flat' && (
                        <span className="px-2.5 py-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/40 text-xs font-semibold rounded-lg backdrop-blur-sm">
                          Forfait
                        </span>
                      )}
                      {breakdown.length > 0 && (
                        <span
                          title={outfit.show_price_breakdown ? 'Décomposition configurée, affichée sur la boutique.' : 'Décomposition enregistrée mais NON affichée sur la boutique (interrupteur public désactivé dans le formulaire).'}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg backdrop-blur-sm flex items-center gap-1.5 ${outfit.show_price_breakdown ? 'bg-brand-gold/10 text-brand-gold/90 border border-brand-gold/25' : 'bg-gray-900/85 text-gray-300 border border-gray-600'}`}
                        >
                          <Layers size={12} /> Décomposition{outfit.show_price_breakdown ? '' : ' · privée'}
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
                            : 'bg-brand-bg text-brand-text-muted border border-brand-gold/20 hover:bg-brand-gold/10 hover:text-brand-text'
                        }`}
                        title={outfit.visible ? 'Masquer le Look' : 'Rendre visible'}
                      >
                        {outfit.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(outfit.id)}
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

                    {/* Lot 3 — résumé de la décomposition : visible dès qu'elle
                        existe (l'interrupteur public ne concerne que la vitrine). */}
                    {breakdown.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-text-muted block">
                          Décomposition du forfait {outfit.show_price_breakdown ? '' : '· non affichée au public'}
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {breakdown.map((line, index) => (
                            <div key={`bd-sum-${outfit.id}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-brand-text truncate">{line.label}</span>
                              <span className="text-brand-gold font-bold whitespace-nowrap">{line.amount.toLocaleString()} FCFA</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-brand-gold/10">
                          <span className="text-brand-text-muted">Total des lignes</span>
                          <span className="text-brand-text font-semibold">{breakdown.reduce((sum, line) => sum + (line.amount || 0), 0).toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    ) : outfit.pricing_mode === 'flat' ? (
                      <p className="text-xs text-brand-text-muted italic">Décomposition : aucune — ajoute des lignes via « Modifier ».</p>
                    ) : null}

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
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <AdminButton variant="secondary" size="sm" className="justify-center" onClick={() => shareOutfitStatus(outfit)}>
                        Statut WhatsApp
                      </AdminButton>
                      <AdminButton variant="success" size="sm" className="justify-center gap-1" disabled={attachedProducts.length === 0} onClick={() => setPendingShareOutfit({ outfit, price: displayPrice })}>
                        <MessageCircle size={14} /> Envoyer client
                      </AdminButton>
                    </div>
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
            {/* IMPL-3 (C3) — prix du look : 2 modes mutuellement exclusifs. */}
            <div className="rounded-xl border border-brand-gold/15 bg-brand-bg p-3 space-y-3">
              <p className="text-sm font-medium text-brand-text">Prix du look</p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Mode de prix du look">
                <button
                  type="button"
                  onClick={() => switchPricingMode('calculated')}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    pricingMode === 'calculated'
                      ? 'bg-brand-gold/15 border-brand-gold text-brand-gold'
                      : 'bg-brand-bg-alt border-brand-gold/10 text-brand-text-muted hover:border-brand-gold/40'
                  }`}
                >
                  Calculé (somme)
                </button>
                <button
                  type="button"
                  onClick={() => switchPricingMode('flat')}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    pricingMode === 'flat'
                      ? 'bg-brand-gold/15 border-brand-gold text-brand-gold'
                      : 'bg-brand-bg-alt border-brand-gold/10 text-brand-text-muted hover:border-brand-gold/40'
                  }`}
                >
                  Forfait (manuel)
                </button>
              </div>
              {pricingMode === 'calculated' ? (
                <p className="text-xs text-brand-text-muted">
                  Total automatique : <span className="font-semibold text-brand-gold">{calculatedSum.toLocaleString()} FCFA</span> — recalculé à chaque modification des pièces du look.
                </p>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-muted mb-2">
                    Prix forfaitaire (FCFA)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={flatPrice}
                    onChange={(e) => setFlatPrice(e.target.value)}
                    placeholder="Ex : 15000"
                    className="w-full rounded-lg border border-brand-gold/20 bg-brand-bg px-4 py-3 text-sm text-brand-text hide-number-spinners focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold"
                  />
                  <p className="mt-1 text-xs text-brand-text-muted">
                    Le forfait est la référence du look — il reste fixe même si tu modifies les pièces. Somme des pièces pour info : {calculatedSum.toLocaleString()} FCFA.
                  </p>
                  {/* IMPL-4 (C3+C4) — décomposition du forfait : lignes libres
                      libellé + montant, JAMAIS d'articles catalogue. */}
                  <div className="mt-4 pt-3 border-t border-brand-gold/10 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">Décomposition du forfait (optionnel)</p>
                    <p className="text-[11px] text-brand-text-muted leading-relaxed">
                      Décris ce que comprend le forfait — libellés et montants libres. Ces lignes ne créent aucun article catalogue.
                    </p>
                    {priceLines.map((line, index) => (
                      <div key={`bd-${index}`} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={line.label}
                          onChange={(e) => setPriceLines((lines) => lines.map((l, i) => (i === index ? { ...l, label: e.target.value } : l)))}
                          placeholder="Ex : Veste signature"
                          className="flex-1 min-w-0 rounded-lg border border-brand-gold/20 bg-brand-bg px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold"
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={line.amount}
                          onChange={(e) => setPriceLines((lines) => lines.map((l, i) => (i === index ? { ...l, amount: e.target.value } : l)))}
                          placeholder="Montant"
                          className="w-28 rounded-lg border border-brand-gold/20 bg-brand-bg px-3 py-2 text-sm text-brand-text hide-number-spinners focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold"
                        />
                        <button
                          type="button"
                          onClick={() => setPriceLines((lines) => lines.filter((_, i) => i !== index))}
                          aria-label={`Supprimer la ligne ${index + 1} de la décomposition`}
                          className="p-2 text-red-500 hover:bg-red-950 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPriceLines((lines) => [...lines, { label: '', amount: '' }])}
                      className="text-xs font-medium text-brand-gold hover:text-brand-gold-light transition-colors cursor-pointer"
                    >
                      + Ajouter une ligne
                    </button>
                    {priceLines.length === 0 && (
                      <p className="text-[11px] text-brand-text-muted italic">
                        Aucune décomposition enregistrée pour ce look — « + Ajouter une ligne » pour décrire ce que comprend le forfait.
                      </p>
                    )}
                    {filledLinesCount > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowBreakdown((visible) => !visible)}
                          className={`flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer ${showBreakdown ? 'text-brand-gold' : 'text-brand-text-muted hover:text-brand-text'}`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${showBreakdown ? 'bg-brand-gold border-brand-gold text-[#0A0A0A]' : 'border-gray-600'}`}>
                            {showBreakdown && <Check size={12} className="stroke-[3]" />}
                          </span>
                          Afficher la décomposition sur la boutique
                        </button>
                        <p className="text-[11px] text-brand-text-muted">
                          Somme des lignes : <span className="font-semibold text-brand-text">{breakdownSum.toLocaleString()} FCFA</span> — indicative, le forfait reste la référence.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

                  {/* E1 — ordre d'affichage public du look (1 = premier) */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-text-muted mb-2">
                      Ordre d’affichage (1 = premier)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Auto (fin de liste)"
                      className="w-full rounded-lg border border-brand-gold/20 bg-brand-bg px-4 py-3 text-sm text-brand-text hide-number-spinners focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold"
                    />
                  </div>

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
                aria-label="Uploader une photo pour l'outfit"
                title="Uploader une photo pour l'outfit"
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

          {/* IMPL-C (UI Boost) — vidéo optionnelle du look : présentée en
              premier dans la fenêtre d'inspection publique ; l'image reste
              l'affiche des listes (grille /looks et carrousel accueil). */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-text mb-1">Vidéo du Look (optionnelle)</label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoUpload}
              disabled={videoUploading}
              className="hidden"
              id="outfit-video-upload"
              aria-label="Uploader une vidéo pour le look"
              title="Uploader une vidéo pour le look"
            />
            <div className="flex items-center gap-4">
              <label
                htmlFor="outfit-video-upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-[#0A0A0A] rounded-xl cursor-pointer hover:bg-brand-gold-light transition-colors font-medium font-bebas uppercase tracking-wider text-sm shadow-md"
              >
                <Video size={18} />
                {videoUploading ? 'Upload de la vidéo...' : videoUrl ? 'Remplacer la vidéo' : 'Ajouter une vidéo'}
              </label>
              {videoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="p-2 text-red-500 hover:bg-red-950 rounded-lg transition-colors cursor-pointer text-sm font-medium"
                >
                  Retirer la vidéo
                </button>
              )}
            </div>
            <p className="text-xs text-brand-text-muted">
              MP4, WebM ou MOV — 30 Mo max. Si elle existe, elle est présentée en premier dans la fenêtre d&apos;inspection du look.
            </p>
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
                        : 'bg-brand-bg-alt border-brand-gold/5 text-brand-text hover:border-brand-gold/30'
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
