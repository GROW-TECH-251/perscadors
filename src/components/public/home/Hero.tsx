'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchPublicShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import { fetchActiveAssetBySection } from '@/services/mediaService';
import type { ShopSettings } from '@/admin/types';

const DEFAULT_HERO_VIDEO = '/assets/backgrounds/7679830-uhd_4096_2160_25fps.mp4';
const EMPTY_ARTICLE_FORM = {
  articleType: '',
  reference: '',
  color: '',
  size: '',
  quantity: '1',
  notes: '',
  urgency: 'Standard',
};

const normalizePhoneDigits = (phone: string) => {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  if (/^\d{8}$/.test(digits)) return `229${digits}`;
  return digits;
};

type HeroMediaType = 'video' | 'image';
type ArticleFormState = typeof EMPTY_ARTICLE_FORM;

type ArticleSubmissionModalProps = {
  show: boolean;
  settings: ShopSettings;
  imagePreview: string | null;
  articleForm: ArticleFormState;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
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
        </div>

        <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#3a3a3a]">Photo</label>
            <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-brand-gold/30 bg-[#EFE8DE]">
              {imagePreview ? (
                <Image src={imagePreview} alt="Aperçu article" fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs text-[#4d4d4d]">
                  Aucune photo
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageSelect}
              className="hidden"
            />
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

            <label className="block space-y-2 text-sm text-[#2f2f2f]">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em]">Notes</span>
              <textarea
                value={articleForm.notes}
                onChange={(event) => onFieldChange('notes', event.target.value)}
                placeholder="Précisions, couleur, budget, référence exacte..."
                rows={4}
                className="w-full rounded-xl border border-brand-gold/30 bg-white px-3 py-2.5 text-[#111111] placeholder:text-[#6b6b6b] focus:border-brand-gold focus:outline-none"
              />
            </label>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onSubmit}
                className="flex-1 rounded-xl bg-brand-gold px-4 py-3 font-bebas text-lg uppercase tracking-[0.20em] text-[#0A0A0A] transition hover:bg-brand-gold-light"
              >
                Envoyer la photo
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReset();
                }}
                className="flex-1 rounded-xl border border-brand-gold/40 bg-white px-4 py-3 font-bebas text-lg uppercase tracking-[0.20em] text-[#111111] transition hover:bg-[#F8F1E7]"
              >
                Annuler
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-[#555555]">
              Le message sera envoyé via WhatsApp au numéro {settings.whatsapp_phone || '22967280018'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Hero: React.FC = () => {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<HeroMediaType>('video');
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState<ArticleFormState>(EMPTY_ARTICLE_FORM);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [realtimeVersion, setRealtimeVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadHero() {
      const [settingsData, assetData] = await Promise.all([
        fetchPublicShopSettings(),
        fetchActiveAssetBySection('hero'),
      ]);

      if (!isMounted) return;

      if (settingsData) {
        setSettings(settingsData);
      }

      if (assetData) {
        setMediaUrl(assetData.url);
        setMediaType(assetData.type === 'image' ? 'image' : 'video');
        return;
      }

      if (settingsData?.hero_video_url) {
        setMediaUrl(settingsData.hero_video_url);
        setMediaType('video');
        return;
      }

      setMediaUrl(DEFAULT_HERO_VIDEO);
      setMediaType('video');
    }

    loadHero();
    return () => {
      isMounted = false;
    };
  }, [realtimeVersion]);

  const heroTitleParts = useMemo(() => {
    const titleParts = settings.hero_title.split('.');
    const primary = titleParts[0]?.trim() || settings.hero_title;
    const secondary = titleParts.slice(1).join('.').trim();

    return { primary, secondary };
  }, [settings.hero_title]);

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

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const resetArticleForm = () => {
    setImagePreview(null);
    setArticleForm(EMPTY_ARTICLE_FORM);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeArticleForm = () => {
    setShowArticleForm(false);
    resetArticleForm();
  };

  const handleSubmitArticle = () => {
    const clientPhone = normalizePhoneDigits(settings.whatsapp_phone || '22967280018');
    const lines = [
      'Bonjour 👋',
      '',
      'Je souhaite soumettre un article.',
      '',
      `Type : ${articleForm.articleType || 'Non précisé'}`,
      `Référence / modèle : ${articleForm.reference || 'Non précisé'}`,
      `Couleur : ${articleForm.color || 'Non précisé'}`,
      `Taille : ${articleForm.size || 'Non précisé'}`,
      `Quantité : ${articleForm.quantity || '1'}`,
      `Urgence : ${articleForm.urgency || 'Standard'}`,
      `Remarques : ${articleForm.notes || 'Aucune remarque'}`,
      '',
      imagePreview ? 'Photo jointe : oui' : 'Photo : pas encore jointe',
      '',
      'Merci de me confirmer si vous pouvez le trouver, le commander ou me proposer une alternative.',
      '',
      'Merci beaucoup.',
    ];

    const url = `https://wa.me/${clientPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    closeArticleForm();
  };

  useShopSettingsRealtime(() => {
    setRealtimeVersion((version) => version + 1);
  });

  useSiteAssetsRealtime(() => {
    setRealtimeVersion((version) => version + 1);
  });

  return (
    <section className="relative w-full h-[calc(100vh-80px)] h-[calc(100svh-80px)] min-h-[560px] sm:min-h-[700px] flex items-center justify-center overflow-hidden bg-black text-[#EDEAE3]">
      {mediaUrl && mediaType === 'video' ? (
        <>
          <video
            aria-hidden="true"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-xl"
          >
            <source src={mediaUrl} type="video/mp4" />
          </video>
          <video
            onError={() => setMediaUrl('')}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain opacity-90"
          >
            <source src={mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </>
      ) : mediaUrl && mediaType === 'image' ? (
        <Image
          src={mediaUrl}
          alt={settings.hero_title}
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover opacity-65"
          priority
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-black/30 to-black/35 z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.25)_20%,transparent_65%)] z-10" />

      <div className="relative z-20 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col items-center justify-center">
        <div className="space-y-4 animate-slide-up-fade">
          <h1 className="font-bebas text-5xl sm:text-7xl lg:text-8xl tracking-wider text-white uppercase drop-shadow-2xl leading-none">
            {heroTitleParts.primary}.
            {heroTitleParts.secondary ? (
              <span className="text-brand-gold"> {heroTitleParts.secondary}.</span>
            ) : null}
          </h1>
          <p className="hidden sm:block text-brand-text-muted max-w-2xl mx-auto text-base sm:text-xl font-light leading-relaxed">
            {settings.hero_subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-4 animate-slide-up-fade">
          <Link
            href="#carousel-outfits"
            className="group w-full sm:w-auto px-9 py-4.5 bg-brand-gold hover:bg-brand-gold-light active:bg-[#9F7F1F] text-[#0A0A0A] font-bebas text-xl tracking-[3px] uppercase transition-all duration-400 ease-[cubic-bezier(0.23,1.0,0.32,1)] hover:scale-[1.03] active:scale-[0.985] rounded-xl shadow-2xl hover:shadow-[0_20px_35px_-10px_rgb(0,0,0,0.5)] ring-1 ring-inset ring-black/10 text-center flex items-center justify-center gap-2.5"
          >
            <span>Voir les outfits</span>
          </Link>
          <Link
            href="#categories"
            className="group w-full sm:w-auto px-9 py-4.5 bg-transparent border-2 border-white hover:border-brand-gold hover:text-brand-gold active:bg-white/5 text-white font-bebas text-xl tracking-[3px] uppercase transition-all duration-400 ease-[cubic-bezier(0.23,1.0,0.32,1)] hover:scale-[1.03] active:scale-[0.985] rounded-xl text-center flex items-center justify-center gap-2.5"
          >
            <span>Voir la collection</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowArticleForm(true)}
            className="group w-full sm:w-auto px-9 py-4.5 bg-white/5 border-2 border-brand-gold/40 hover:border-brand-gold hover:bg-brand-gold/10 active:bg-brand-gold/20 text-brand-gold font-bebas text-xl tracking-[3px] uppercase transition-all duration-400 ease-[cubic-bezier(0.23,1.0,0.32,1)] hover:scale-[1.03] active:scale-[0.985] rounded-xl text-center flex items-center justify-center gap-2.5"
          >
            <span>Ajouter votre article</span>
          </button>
        </div>
      </div>

      <ArticleSubmissionModal
        show={showArticleForm}
        settings={settings}
        imagePreview={imagePreview}
        articleForm={articleForm}
        fileInputRef={fileInputRef}
        onClose={() => setShowArticleForm(false)}
        onImageSelect={handleImageSelect}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmitArticle}
        onReset={resetArticleForm}
      />
    </section>
  );
};
