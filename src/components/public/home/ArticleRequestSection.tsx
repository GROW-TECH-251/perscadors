'use client';

import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { fetchPublicShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import type { ShopSettings } from '@/admin/types';
import { SearchX, Upload, MessageCircle, Loader2 } from 'lucide-react';

const EMPTY_ARTICLE_FORM = {
  articleType: '',
  reference: '',
  color: '',
  size: '',
  quantity: '1',
  budget: '',
  notes: '',
  urgency: 'Standard',
};

const normalizePhoneDigits = (phone: string) => {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  if (/^\d{8}$/.test(digits)) return `229${digits}`;
  return digits;
};

type ArticleFormState = typeof EMPTY_ARTICLE_FORM;

type ArticleSubmissionModalProps = {
  show: boolean;
  settings: ShopSettings;
  imagePreview: string | null;
  articleForm: ArticleFormState;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  onClose: () => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFieldChange: (field: keyof ArticleFormState, value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
};

function ArticleSubmissionModal({
  show,
  settings,
  imagePreview,
  articleForm,
  fileInputRef,
  isUploading,
  onClose,
  onImageSelect,
  onFieldChange,
  onSubmit,
  onReset,
}: ArticleSubmissionModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-brand-gold/20 bg-[#F7F3ED] p-4 sm:p-6 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            onClose();
            onReset();
          }}
          className="absolute right-4 top-4 rounded-full border border-brand-gold/30 px-2.5 py-1 text-sm text-brand-gold"
        >
          ✕
        </button>

        <div className="mb-5 pr-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">Soumission article</p>
          <h3 className="mt-2 font-bebas text-3xl uppercase tracking-wider text-[#111111]">Ajouter votre article</h3>
          <p className="mt-2 text-sm text-[#555555] leading-relaxed">
            Vous ne trouvez pas ce que vous cherchez ? Envoyez-nous une photo, on vous trouve ça en 24h.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#3a3a3a]">Photo</label>
            <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-brand-gold/30 bg-[#EFE8DE]">
              {imagePreview ? (
                <Image src={imagePreview} alt="Aperçu article" fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs text-[#4d4d4d]">Aucune photo</div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border border-brand-gold/40 bg-[#F1E3BC] px-3 py-2 text-sm font-medium text-[#1a1a1a] transition hover:bg-[#E9D39D]"
            >
              {imagePreview ? 'Changer la photo' : 'Ajouter la photo'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[#2f2f2f]">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em]">Type</span>
                <input
                  value={articleForm.articleType}
                  onChange={(event) => onFieldChange('articleType', event.target.value)}
                  placeholder="Vêtement, chaussure, sac..."
                  className="w-full rounded-xl border border-brand-gold/30 bg-white px-3 py-2.5 text-[#111111] placeholder:text-[#6b6b6b] focus:border-brand-gold focus:outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-[#2f2f2f]">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em]">Référence</span>
                <input
                  value={articleForm.reference}
                  onChange={(event) => onFieldChange('reference', event.target.value)}
                  placeholder="Nom / marque / modèle"
                  className="w-full rounded-xl border border-brand-gold/30 bg-white px-3 py-2.5 text-[#111111] placeholder:text-[#6b6b6b] focus:border-brand-gold focus:outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-[#2f2f2f]">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em]">Couleur</span>
                <input
                  value={articleForm.color}
                  onChange={(event) => onFieldChange('color', event.target.value)}
                  placeholder="Noir, blanc, beige..."
                  className="w-full rounded-xl border border-brand-gold/30 bg-white px-3 py-2.5 text-[#111111] placeholder:text-[#6b6b6b] focus:border-brand-gold focus:outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-[#2f2f2f]">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em]">Taille</span>
                <input
                  value={articleForm.size}
                  onChange={(event) => onFieldChange('size', event.target.value)}
                  placeholder="M, L, 42, etc."
                  className="w-full rounded-xl border border-brand-gold/30 bg-white px-3 py-2.5 text-[#111111] placeholder:text-[#6b6b6b] focus:border-brand-gold focus:outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[#2f2f2f]">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em]">Quantité</span>
                <input
                  type="number"
                  min="1"
                  value={articleForm.quantity}
                  onChange={(event) => onFieldChange('quantity', event.target.value)}
                  className="w-full rounded-xl border border-brand-gold/30 bg-white px-3 py-2.5 text-[#111111] focus:border-brand-gold focus:outline-none"
                />
              </label>
              <label className="space-y-2 text-sm text-[#2f2f2f]">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em]">Urgence</span>
                <select
                  value={articleForm.urgency}
                  onChange={(event) => onFieldChange('urgency', event.target.value)}
                  className="w-full rounded-xl border border-brand-gold/30 bg-white px-3 py-2.5 text-[#111111] focus:border-brand-gold focus:outline-none"
                >
                  <option>Standard</option>
                  <option>Urgent</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-[#2f2f2f]">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em]">Budget (FCFA)</span>
                <input
                  value={articleForm.budget}
                  onChange={(event) => onFieldChange('budget', event.target.value)}
                  placeholder="Ex: 25000, 30000..."
                  className="w-full rounded-xl border border-brand-gold/30 bg-white px-3 py-2.5 text-[#111111] placeholder:text-[#6b6b6b] focus:border-brand-gold focus:outline-none"
                />
              </label>
              <div className="flex items-end pb-2">
                <p className="text-[11px] text-[#777]">Budget indicatif pour que Vioutou vous propose la meilleure offre</p>
              </div>
            </div>

            <label className="block space-y-2 text-sm text-[#2f2f2f]">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em]">Notes</span>
              <textarea
                value={articleForm.notes}
                onChange={(event) => onFieldChange('notes', event.target.value)}
                placeholder="Précisions, couleur, budget, référence exacte..."
                rows={3}
                className="w-full rounded-xl border border-brand-gold/30 bg-white px-3 py-2.5 text-[#111111] placeholder:text-[#6b6b6b] focus:border-brand-gold focus:outline-none"
              />
            </label>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onSubmit}
                disabled={isUploading}
                className="flex-1 rounded-xl bg-brand-gold px-4 py-3 font-bebas text-lg uppercase tracking-[0.20em] text-[#0A0A0A] transition hover:bg-brand-gold-light disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Upload en cours...
                  </>
                ) : (
                  'Envoyer via WhatsApp'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReset();
                }}
                disabled={isUploading}
                className="flex-1 rounded-xl border border-brand-gold/40 bg-white px-4 py-3 font-bebas text-lg uppercase tracking-[0.20em] text-[#111111] transition hover:bg-[#F8F1E7] disabled:opacity-50"
              >
                Annuler
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-[#555555]">
              Le message sera envoyé via WhatsApp au numéro {settings.whatsapp_phone || '22967280018'}. {imagePreview ? 'La photo sera uploadée et le lien inclus automatiquement.' : 'Ajoutez une photo pour une demande plus précise.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ArticleRequestSection: React.FC = () => {
  const [settings, setSettings] = useState(getDefaultShopSettings());
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [articleForm, setArticleForm] = useState(EMPTY_ARTICLE_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const data = await fetchPublicShopSettings();
      if (data) setSettings(data);
    }
    loadSettings();
  }, []);

  useShopSettingsRealtime(() => {
    void (async () => {
      const data = await fetchPublicShopSettings();
      if (data) setSettings(data);
    })();
  });

  const handleFieldChange = (field: keyof ArticleFormState, value: string) => {
    setArticleForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Veuillez choisir une image valide.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert('Image trop volumineuse (max 5MB).');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const resetArticleForm = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setArticleForm(EMPTY_ARTICLE_FORM);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeArticleForm = () => {
    setShowArticleForm(false);
    resetArticleForm();
  };

  const uploadImageIfNeeded = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/media/article-request-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        console.warn('Upload article request failed', result.error);
        return null;
      }

      return result.url;
    } catch (err) {
      console.warn('Upload error', err);
      return null;
    }
  };

  const handleSubmitArticle = async () => {
    setIsUploading(true);

    // FIX PUB-FUNC-01 : Upload image avec lien
    // Avant : imagePreview base64 local non envoyable via wa.me (texte uniquement)
    // Après : upload vers Supabase Storage article-requests via API service_role → URL publique → incluse dans message WhatsApp
    const uploadedImageUrl = await uploadImageIfNeeded();

    const clientPhone = normalizePhoneDigits(settings.whatsapp_phone || '22967280018');
    const lines = [
      'Bonjour Vioutou 👋',
      '',
      'Je ne trouve pas ce que je cherche dans le catalogue, pouvez-vous m\'aider ?',
      '',
      `Type : ${articleForm.articleType || 'Non précisé'}`,
      `Référence / modèle : ${articleForm.reference || 'Non précisé'}`,
      `Couleur : ${articleForm.color || 'Non précisé'}`,
      `Taille : ${articleForm.size || 'Non précisé'}`,
      `Quantité : ${articleForm.quantity || '1'}`,
      `Budget : ${articleForm.budget || 'Non précisé'} FCFA`,
      `Urgence : ${articleForm.urgency || 'Standard'}`,
      `Remarques : ${articleForm.notes || 'Aucune remarque'}`,
      '',
      uploadedImageUrl ? `📸 Photo : ${uploadedImageUrl}` : imagePreview ? 'Photo jointe : oui (upload échoué, à envoyer manuellement)' : 'Photo : pas encore jointe',
      '',
      'Merci de me confirmer si vous pouvez le trouver, le commander ou me proposer une alternative.',
      '',
      'Merci beaucoup ! 🙌',
    ];

    const url = `https://wa.me/${clientPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsUploading(false);
    closeArticleForm();
  };

  return (
    <section id="article-request" className="py-20 bg-brand-bg-alt border-y border-brand-gold/10 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-bg border border-brand-gold/10 rounded-3xl p-8 sm:p-12 shadow-[0_24px_60px_rgba(10,10,10,0.08)] flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-gold/10 rounded-full">
                <SearchX size={24} className="text-brand-gold" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">Vous ne trouvez pas ?</p>
            </div>
            <h2 className="font-bebas text-3xl sm:text-4xl lg:text-5xl tracking-wider text-brand-text uppercase leading-none">
              Vous ne trouvez pas ce que vous cherchez ?
              <span className="text-brand-gold"> Ajoutez votre demande.</span>
            </h2>
            <p className="text-brand-text-muted text-sm sm:text-base leading-relaxed max-w-2xl">
              Notre catalogue évolue chaque jour. Envoyez-nous une photo de l&apos;article que vous souhaitez (chaussure, jean, complet, tapette) avec votre taille et budget, on vous trouve ça en 24h via WhatsApp.
            </p>
            <div className="flex items-center gap-6 pt-2 text-xs text-brand-text-muted">
              <span className="flex items-center gap-2">
                <Upload size={14} className="text-brand-gold" /> Photo avec lien
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle size={14} className="text-brand-gold" /> WhatsApp direct
              </span>
              <span>24h réponse</span>
            </div>
          </div>

          <div className="flex-shrink-0 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setShowArticleForm(true)}
              className="w-full lg:w-auto px-8 py-4 bg-brand-gold hover:bg-brand-gold-light active:bg-[#9F7F1F] text-[#0A0A0A] font-bebas text-xl tracking-[3px] uppercase rounded-xl shadow-2xl hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-black/10 transition-all duration-400 hover:scale-[1.03] active:scale-[0.985] flex items-center justify-center gap-2.5"
            >
              <span>Ajouter votre demande</span>
            </button>
          </div>
        </div>
      </div>

      <ArticleSubmissionModal
        show={showArticleForm}
        settings={settings}
        imagePreview={imagePreview}
        articleForm={articleForm}
        fileInputRef={fileInputRef}
        isUploading={isUploading}
        onClose={() => setShowArticleForm(false)}
        onImageSelect={handleImageSelect}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmitArticle}
        onReset={resetArticleForm}
      />
    </section>
  );
};

export default ArticleRequestSection;
