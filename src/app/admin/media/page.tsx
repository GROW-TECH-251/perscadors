// src/app/admin/media/page.tsx
// ============================================
// DYNAMIC MEDIA MANAGEMENT + ADMIN DASHBOARD SYSTEM
// ============================================
// Tableau de bord universel pour piloter l'intégralité des photos, vidéos, logos et embeds sociaux du site

'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminInput, AdminModal, AdminSkeleton, AdminConfirmDialog } from '@/admin/components';
import { Film, Image as ImageIcon, Plus, Trash2, Eye, EyeOff, Upload, CheckCircle2, AlertCircle, Link as LinkIcon, Sparkles } from 'lucide-react';
import { fetchSiteAssets, uploadSiteAssetMedia, upsertSiteAsset, deleteSiteAsset, toggleSiteAssetActive } from '@/services/mediaService';
import type { SiteAsset, SiteAssetSection, SiteAssetType } from '@/admin/types';

const SECTIONS_CONFIG: { id: SiteAssetSection; label: string; description: string; hybrid: boolean }[] = [
  { id: 'hero', label: 'Héros (Hero Media)', description: 'Média d\'accueil en arrière-plan (Vidéo MP4 ou Bannière Image)', hybrid: false },
  { id: 'logo', label: 'Logos (Navbar & Footer)', description: 'Logos officiels de la boutique (PNG, WEBP, JPG)', hybrid: false },
  { id: 'testimonials', label: 'Vidéos Témoignages', description: 'Preuve sociale vidéo (Clients VIP & Avis)', hybrid: true },
  { id: 'ambience', label: 'Bannières & Ambiance', description: 'Photos de transition et bannières d\'ambiance urbaine', hybrid: false },
  { id: 'tiktok', label: 'TikTok Embeds', description: 'Vidéos TikTok virales de Vioutou (URL ou Upload MP4)', hybrid: true },
  { id: 'reels', label: 'Instagram Reels', description: 'Reels Instagram & FB (Envers du décor & Drops)', hybrid: true },
  { id: 'sections', label: 'Photos Sections', description: 'Photos descriptives des sections du catalogue', hybrid: false },
  { id: 'thumbnails', label: 'Miniatures & Covers', description: 'Couvertures et miniatures d\'articles premium', hybrid: false },
  { id: 'backgrounds', label: 'Arrière-plans', description: 'Fonds d\'ambiance (Backgrounds globaux)', hybrid: false },
  { id: 'galleries', label: 'Galeries Streetwear', description: 'Carrousels et galeries de shooting', hybrid: false }
];

export default function AdminMediaPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<SiteAssetSection>('hero');
  
  // Modale d'upload / création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [alt, setAlt] = useState('');
  const [description, setDescription] = useState('');
  const [isSocialUrl, setIsSocialUrl] = useState(false);
  const [socialUrl, setSocialUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  
  // États de chargement & retours utilisateurs
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSiteAssets();
      setAssets(data);
    } catch (err: unknown) {
      console.error('Erreur chargement media assets:', err);
      setToastMessage({ type: 'error', text: 'Erreur lors du chargement des médias.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssets();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAssets]);

  useSiteAssetsRealtime(loadAssets);

  // Purge du toast après 4s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const currentSectionConfig = useMemo(() => {
    return SECTIONS_CONFIG.find((s) => s.id === selectedSection) || SECTIONS_CONFIG[0];
  }, [selectedSection]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => a.section === selectedSection);
  }, [assets, selectedSection]);

  // ============================================
  // GESTION RAPIDE DES ASSETS (Activer / Supprimer)
  // ============================================
  const handleToggleActive = async (id: string, nextActive: boolean) => {
    setProcessingId(id);
    try {
      setAssets((current) => current.map((a) => (a.id === id ? { ...a, active: nextActive } : a)));
      const res = await toggleSiteAssetActive(id, nextActive);
      if (res.error) {
        setToastMessage({ type: 'error', text: 'Erreur de mise à jour. Contactez votre administrateur.' });
        await loadAssets();
      } else {
        setToastMessage({ type: 'success', text: nextActive ? 'Média activé sur la vitrine !' : 'Média désactivé.' });
      }
    } catch (err: unknown) {
      console.error('Erreur toggle active:', err);
      setToastMessage({ type: 'error', text: 'Une erreur est survenue.' });
      await loadAssets();
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setPendingDeleteId(null);
    setProcessingId(id);
    try {
      const res = await deleteSiteAsset(id);
      if (res.error) {
        setToastMessage({ type: 'error', text: 'Erreur de suppression. Contactez votre administrateur.' });
      } else {
        setToastMessage({ type: 'success', text: 'Média supprimé avec succès.' });
        setAssets((current) => current.filter((a) => a.id !== id));
      }
    } catch (err: unknown) {
      console.error('Erreur suppression:', err);
      setToastMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================
  // UPLOAD & CREATION HYBRIDE (Image / Vidéo / URL)
  // ============================================
  const handleOpenModal = () => {
    setTitle('');
    setAlt('');
    setDescription('');
    setIsSocialUrl(false);
    setSocialUrl('');
    setSelectedFile(null);
    setFilePreview('');
    setIsModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsSocialUrl(false);
    setSocialUrl('');
    setFilePreview(URL.createObjectURL(file));

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
    if (!alt) {
      setAlt(`Média HP Collection — ${selectedSection}`);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSocialUrl && !socialUrl.trim()) {
      setToastMessage({ type: 'error', text: 'Veuillez saisir une URL sociale valide (TikTok, Instagram, etc.).' });
      return;
    }

    if (!isSocialUrl && !selectedFile) {
      setToastMessage({ type: 'error', text: 'Veuillez sélectionner un fichier à uploader.' });
      return;
    }

    if (!title.trim()) {
      setToastMessage({ type: 'error', text: 'Le titre du média est requis.' });
      return;
    }

    setUploading(true);
    try {
      let finalUrl = socialUrl.trim();
      let storagePath = `social/${Date.now()}`;
      let mediaType: SiteAssetType = 'video';

      if (!isSocialUrl && selectedFile) {
        const uploadRes = await uploadSiteAssetMedia(selectedSection, selectedFile);
        if (uploadRes.error || !uploadRes.data) {
          setToastMessage({ type: 'error', text: 'Erreur d’upload du fichier. Veuillez réessayer.' });
          setUploading(false);
          return;
        }
        finalUrl = uploadRes.data.url;
        storagePath = uploadRes.data.storage_path;
        mediaType = uploadRes.data.type;
      } else if (isSocialUrl) {
        mediaType = finalUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? 'image' : 'video';
      }

      const res = await upsertSiteAsset({
        type: mediaType,
        section: selectedSection,
        url: finalUrl,
        storage_path: storagePath,
        alt: alt.trim() || title.trim(),
        title: title.trim(),
        description: description.trim(),
        active: true,
        order_index: filteredAssets.length + 1,
        is_social_url: isSocialUrl
      });

      if (res.error || !res.data) {
        setToastMessage({ type: 'error', text: 'Erreur lors de l’enregistrement du média.' });
      } else {
        setToastMessage({ type: 'success', text: 'Média uploadé et synchronisé en direct sur le site !' });
        setAssets((current) => [...current, res.data!]);
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      console.error('Erreur submit media:', err);
      setToastMessage({ type: 'error', text: 'Une erreur inattendue est survenue.' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-full max-w-6xl space-y-5"><AdminSkeleton className="h-12 w-1/3" /><div className="flex gap-3"><AdminSkeleton className="h-16 w-36" /><AdminSkeleton className="h-16 w-36" /><AdminSkeleton className="h-16 w-36" /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-5"><AdminSkeleton className="h-72" /><AdminSkeleton className="h-72" /><AdminSkeleton className="h-72" /></div></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Toast de retours (UX Non-Technique) */}
      <AdminConfirmDialog isOpen={pendingDeleteId !== null} title="Supprimer ce média ?" description="Ce visuel sera retiré de la bibliothèque et pourra ne plus apparaître sur la vitrine. Cette action est irréversible." loading={pendingDeleteId ? processingId === pendingDeleteId : false} onCancel={() => setPendingDeleteId(null)} onConfirm={() => pendingDeleteId && handleDelete(pendingDeleteId)} />

      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 animate-slide-up-fade flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#0A0A0A]/95 border border-brand-gold/20 shadow-2xl backdrop-blur-md">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
          )}
          <p className="font-bebas text-lg text-white tracking-wider uppercase">{toastMessage.text}</p>
        </div>
      )}

      {/* En-tête Principal */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between border-b border-brand-gold/10 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold border border-brand-gold/20 shadow-sm">
            <Sparkles size={12} className="animate-pulse" /> Bibliothèque visuelle de la boutique
          </span>
          <h1 className="font-bebas text-4xl tracking-wider text-brand-text uppercase mt-3">Médias & visuels</h1>
          <p className="text-brand-text-muted mt-1 text-base">
            Choisissez où vos photos et vidéos apparaissent, puis remplacez-les en toute simplicité.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour Dashboard</AdminButton>
          <AdminButton variant="primary" onClick={handleOpenModal} className="shadow-lg">
            <Plus size={20} />
            Uploader un Média ({currentSectionConfig.label})
          </AdminButton>
        </div>
      </div>

      {/* Grille de Catégories (Sections Médias) */}
      <div className="space-y-3">
        <label className="font-bebas text-xl text-brand-gold uppercase tracking-wider block">
          Choisissez l&apos;emplacement à personnaliser :
        </label>
        <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-none">
          {SECTIONS_CONFIG.map((section) => {
            const isSelected = section.id === selectedSection;
            const count = assets.filter((a) => a.section === section.id).length;
            const activeCount = assets.filter((a) => a.section === section.id && a.active).length;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setSelectedSection(section.id)}
                className={`flex flex-col gap-1 px-5 py-3 rounded-2xl border transition-all duration-300 flex-shrink-0 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-brand-gold text-[#0A0A0A] border-brand-gold shadow-xl scale-[1.02]'
                    : 'bg-brand-bg-alt text-brand-text border-brand-gold/10 hover:bg-brand-gold/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-bebas text-lg uppercase tracking-wider ${isSelected ? 'text-[#0A0A0A]' : 'text-brand-text'}`}>
                    {section.label}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isSelected ? 'bg-[#0A0A0A]/10 border-[#0A0A0A]/20 text-[#0A0A0A]' : 'bg-brand-bg border-brand-gold/10 text-brand-text-muted'
                  }`}>
                    {activeCount}/{count}
                  </span>
                </div>
                <span className={`text-xs line-clamp-1 ${isSelected ? 'text-[#0A0A0A]/80 font-medium' : 'text-brand-text-muted'}`}>
                  {section.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zone Principale : Grille des Médias de la Section */}
      <div className="space-y-4">
        <div className="bg-brand-bg-alt p-4 rounded-2xl border border-brand-gold/15 flex items-center justify-between flex-wrap gap-4 shadow-sm">
          <div>
            <h2 className="font-bebas text-2xl text-brand-text uppercase tracking-wider">
              {currentSectionConfig.label}
            </h2>
            <p className="text-sm text-brand-text-muted mt-0.5">
              {currentSectionConfig.description} • Système flexible (Accepte librement image ou vidéo)
            </p>
          </div>
          <AdminButton variant="primary" size="sm" onClick={handleOpenModal}>
            <Upload size={16} /> Ajouter à cette section
          </AdminButton>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="border-2 border-dashed border-brand-gold/20 rounded-3xl p-12 text-center bg-brand-bg-alt/50 space-y-4 shadow-inner">
            <Film size={56} className="mx-auto text-brand-gold animate-pulse" />
            <div className="space-y-1">
              <h3 className="font-bebas text-2xl text-brand-text uppercase">Aucun média dans cette zone</h3>
              <p className="text-brand-text-muted text-sm max-w-md mx-auto">
                Cette section utilise actuellement la vidéo ou l&apos;image par défaut du site. Uploade ton propre fichier pour la remplacer instantanément !
              </p>
            </div>
            <AdminButton variant="primary" onClick={handleOpenModal} className="mx-auto mt-2">
              <Plus size={18} /> Uploader mon premier média
            </AdminButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => {
              const isProcessing = processingId === asset.id;

              return (
                <AdminCard key={asset.id} className="p-0 overflow-hidden relative group/media border-brand-gold/15 hover:border-brand-gold/40 transition-all shadow-md hover:shadow-xl flex flex-col justify-between">
                  <div>
                    {/* Conteneur de prévisualisation (Image / Vidéo) */}
                    <div className="relative w-full aspect-[16/10] bg-black overflow-hidden flex items-center justify-center border-b border-brand-gold/10">
                      {asset.type === 'video' ? (
                        asset.is_social_url ? (
                          <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 via-black to-blue-900/40 flex flex-col items-center justify-center p-4 text-center space-y-2">
                            <LinkIcon size={32} className="text-brand-gold animate-bounce" />
                            <p className="font-bebas text-lg text-white uppercase tracking-wider truncate w-full">{asset.title}</p>
                            <span className="text-xs text-brand-gold font-mono bg-black/60 px-3 py-1 rounded-full border border-brand-gold/20 truncate w-full">
                              {asset.url}
                            </span>
                          </div>
                        ) : (
                          <video
                            src={asset.url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-90 group-hover/media:opacity-100 transition-opacity"
                          />
                        )
                      ) : (
                        <Image
                          src={asset.url || '/images/LOGOSITE/logo.png'}
                          alt={asset.alt}
                          fill
                          sizes="(max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover/media:scale-105"
                          unoptimized
                        />
                      )}

                      {/* Badges d'état */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        {asset.active ? (
                          <span className="px-2.5 py-1 bg-emerald-950/90 text-emerald-400 border border-emerald-800 text-xs font-semibold rounded-lg backdrop-blur-sm flex items-center gap-1.5 shadow">
                            <Eye size={12} /> En ligne
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-900/90 text-gray-400 border border-gray-700 text-xs font-semibold rounded-lg backdrop-blur-sm flex items-center gap-1.5 shadow">
                            <EyeOff size={12} /> Inactif
                          </span>
                        )}
                        <span className="px-2.5 py-1 bg-[#0A0A0A]/90 text-brand-gold border border-brand-gold/30 text-xs font-semibold rounded-lg backdrop-blur-sm uppercase tracking-widest shadow flex items-center gap-1">
                          {asset.type === 'video' ? <Film size={11} /> : <ImageIcon size={11} />} {asset.type}
                        </span>
                      </div>

                      {/* Actions Rapides en Superposition */}
                      <div className="absolute top-3 right-3 flex gap-2 z-10">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(asset.id, !asset.active)}
                          disabled={isProcessing}
                          className={`p-2.5 rounded-full shadow-lg transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-sm ${
                            asset.active
                              ? 'bg-emerald-500 text-[#0A0A0A] hover:bg-emerald-400'
                              : 'bg-brand-bg text-brand-text-muted border border-brand-gold/20 hover:bg-brand-gold/10 hover:text-brand-text'
                          }`}
                          title={asset.active ? 'Désactiver du site' : 'Mettre en ligne'}
                        >
                          {asset.active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(asset.id)}
                          disabled={isProcessing}
                          className="p-2.5 bg-red-950/80 text-red-400 hover:bg-red-600 hover:text-white rounded-full shadow-lg transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-sm opacity-0 group-hover/media:opacity-100"
                          title="Supprimer définitivement"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60 pointer-events-none" />
                    </div>

                    {/* Fiche Descriptrice */}
                    <div className="p-5 space-y-3 bg-brand-bg-alt">
                      <div>
                        <h3 className="font-bebas text-2xl text-brand-text uppercase leading-tight truncate">
                          {asset.title}
                        </h3>
                        <p className="text-xs text-brand-text-muted truncate mt-0.5">
                          Alt / SEO : {asset.alt}
                        </p>
                      </div>

                      {asset.description && (
                        <p className="text-sm text-brand-text-muted line-clamp-2 leading-relaxed bg-brand-bg p-2.5 rounded-xl border border-brand-gold/10">
                          {asset.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-brand-text-muted pt-2 border-t border-brand-gold/10">
                        <span>Index : #{asset.order_index}</span>
                        <span>{new Date(asset.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </AdminCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale d'Upload & Ajout de Médias (Hybride) */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Uploader un média — ${currentSectionConfig.label}`}
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Section d'explication */}
          <div className="bg-brand-gold/10 border border-brand-gold/20 p-4 rounded-2xl text-sm text-brand-text-muted space-y-1">
            <p className="font-bebas text-lg text-brand-gold uppercase tracking-wider">Flexibilité Totale</p>
            <p>Tu peux uploader librement une image (JPG, PNG, WEBP) ou une vidéo (MP4, MOV). Le site s&apos;adaptera automatiquement sans casser.</p>
          </div>

          {/* Onglets Hybrides (Fichier vs URL Sociale) */}
          {currentSectionConfig.hybrid && (
            <div className="flex gap-2 p-1 bg-brand-bg rounded-2xl border border-brand-gold/10">
              <button
                type="button"
                onClick={() => setIsSocialUrl(false)}
                className={`flex-1 py-2.5 rounded-xl font-bebas uppercase tracking-wider text-sm transition-all ${
                  !isSocialUrl ? 'bg-brand-gold text-[#0A0A0A] shadow-md' : 'text-brand-text hover:bg-brand-gold/10'
                }`}
              >
                Upload Fichier (MP4 / JPG)
              </button>
              <button
                type="button"
                onClick={() => setIsSocialUrl(true)}
                className={`flex-1 py-2.5 rounded-xl font-bebas uppercase tracking-wider text-sm transition-all ${
                  isSocialUrl ? 'bg-brand-gold text-[#0A0A0A] shadow-md' : 'text-brand-text hover:bg-brand-gold/10'
                }`}
              >
                URL Sociale (TikTok / Reels)
              </button>
            </div>
          )}

          {/* Saisie de l'URL ou Zone de Drop */}
          {isSocialUrl ? (
            <div className="space-y-4 animate-slide-up-fade">
              <AdminInput
                label="URL Sociale (TikTok, Instagram, YouTube Shorts)"
                value={socialUrl}
                onChange={setSocialUrl}
                placeholder="https://www.tiktok.com/@vioutou_hp/video/..."
                required={isSocialUrl}
              />
              <p className="text-xs text-brand-text-muted italic">
                Copie-colle le lien direct de ta vidéo TikTok ou de ton Reel Instagram. Elle s&apos;intégrera nativement sur la vitrine.
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-slide-up-fade">
              <label htmlFor="media-file-upload" className="block text-sm font-medium text-brand-text mb-1">Fichier Local (Glisser-déposer ou Parcourir)</label>
              <div className="relative border-2 border-dashed border-brand-gold/30 hover:border-brand-gold rounded-3xl p-8 text-center bg-brand-bg transition-all group cursor-pointer overflow-hidden shadow-sm">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  id="media-file-upload"
                  aria-label="Fichier local à uploader"
                  title="Fichier local à uploader"
                />
                
                {filePreview ? (
                  <div className="space-y-4 pointer-events-none relative z-10">
                    {selectedFile?.type.startsWith('video/') ? (
                      <div className="w-full max-w-xs aspect-[16/10] mx-auto bg-black rounded-2xl overflow-hidden border border-brand-gold/20 shadow">
                        <video src={filePreview} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="relative w-full max-w-xs aspect-[16/10] mx-auto bg-black rounded-2xl overflow-hidden border border-brand-gold/20 shadow">
                        <Image src={filePreview} alt="Preview" fill sizes="320px" className="object-cover" unoptimized />
                      </div>
                    )}
                    <p className="font-bebas text-lg text-brand-gold uppercase tracking-wider truncate max-w-xs mx-auto">
                      {selectedFile?.name} ({(selectedFile?.size || 0) / 1024 / 1024 > 1 ? `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(1)} Mo` : `${Math.round((selectedFile?.size || 0) / 1024)} Ko`})
                    </p>
                    <span className="inline-block px-4 py-1.5 bg-brand-bg-alt text-brand-text text-xs font-semibold rounded-xl border border-brand-gold/20 shadow-sm">
                      Cliquer ou glisser pour remplacer
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3 pointer-events-none relative z-10">
                    <div className="w-16 h-16 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                      <Upload size={28} className="text-brand-gold animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bebas text-2xl text-brand-text uppercase tracking-wider">Déposer un fichier ici</p>
                      <p className="text-xs text-brand-text-muted">Formats acceptés : JPG, PNG, WEBP, MP4, MOV, WEBM (Max 50 Mo)</p>
                    </div>
                    <span className="inline-block px-6 py-2.5 bg-brand-gold text-[#0A0A0A] font-bebas uppercase tracking-wider text-sm rounded-xl shadow-md group-hover:bg-brand-gold-light transition-colors">
                      Parcourir les fichiers
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Métadonnées SEO & Accessibilité */}
          <div className="space-y-4 pt-4 border-t border-brand-gold/15">
            <h3 className="font-bebas text-xl text-brand-gold uppercase tracking-wider">
              2. Informations SEO & Accessibilité
            </h3>
            <AdminInput
              label="Titre du Média"
              value={title}
              onChange={setTitle}
              placeholder="Ex: Bannière Drop d'Été 2026"
              required
            />
            <AdminInput
              label="Texte Alternatif (Alt text pour SEO & aveugles)"
              value={alt}
              onChange={setAlt}
              placeholder="Ex: Veste en denim premium HP Collection portée à Cotonou"
              required
            />
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Description Interne (Optionnel)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Notes internes pour te souvenir du contexte de ce média..."
                className="w-full bg-brand-bg border border-brand-gold/20 rounded-2xl px-4 py-3 text-brand-text text-sm focus:outline-none focus:border-brand-gold transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-brand-gold/15">
            <AdminButton type="submit" variant="primary" loading={uploading} className="flex-1 shadow-lg">
              {uploading ? 'Upload en cours (Patientez)...' : 'Enregistrer et Mettre en ligne'}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={uploading}>
              Annuler
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
