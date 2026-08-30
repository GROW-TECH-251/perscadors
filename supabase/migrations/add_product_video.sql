-- ============================================
-- IMP-08 — Vidéo produit (30/08/2026)
-- ============================================
-- Ajoute la vidéo optionnelle aux produits :
--   - video_url        : URL de livraison Cloudinary (MP4 H.264/AAC, f_mp4,q_auto)
--   - video_public_id  : identifiant public Cloudinary (suppression au remplacement/retrait)
--
-- Idempotent : réexécutable sans erreur.
-- RLS : inchangée — les policies products s'appliquent par ligne, pas par colonne.
-- Compatibilité : sans cette migration, le code IMP-08 est défensif
-- (champs absents = aucune vidéo affichée, aucun crash).

alter table public.products
  add column if not exists video_url text null;

alter table public.products
  add column if not exists video_public_id text null;

comment on column public.products.video_url is 'IMP-08 : URL de livraison Cloudinary (MP4 H.264/AAC) — vidéo optionnelle de la fiche produit.';

comment on column public.products.video_public_id is 'IMP-08 : identifiant public Cloudinary pour suppression lors du remplacement ou du retrait de la vidéo.';
