-- Perscadors — IMPL-C (UI Boost 09/2026) : vidéo optionnelle des HP Looks.
-- Réplique du schéma produit (add_product_video.sql, IMP-08) sur la table
-- outfits :
--   - video_url        : URL de livraison Cloudinary (MP4 H.264/AAC, f_mp4,q_auto)
--   - video_public_id  : identifiant public Cloudinary (suppression au remplacement/retrait)
--
-- Idempotente : réexécutable sans erreur.
-- RLS : inchangée — les policies outfits s'appliquent par ligne, pas par colonne.
-- Compatibilité : sans cette migration, le code IMPL-C est défensif — champs
-- absents = aucune vidéo affichée côté public, aucun crash ; et l'enregistrement
-- d'un look AVEC vidéo renvoie un message explicite demandant d'exécuter cette
-- migration (jamais de perte silencieuse).
--
-- PRÉREQUIS : exécuter dans le projet Supabase de PRODUCTION (Project Ref =
-- NEXT_PUBLIC_SUPABASE_URL). La garde ci-dessous échoue avec un message
-- explicite sur un projet/branche sans le schéma.
--
-- Rollback : alter table public.outfits drop column if exists video_url;
--            alter table public.outfits drop column if exists video_public_id;
-- (perte des vidéos associées aux looks ; l'affichage retombe sur l'image.)

begin;

do $$
begin
  if to_regclass('public.outfits') is null then
    raise exception 'PRÉREQUIS ABSENT : la table public.outfits n''existe pas dans cette base — vous n''êtes probablement pas sur le bon projet Supabase. Vérifiez le sélecteur de projet (et Project Settings > API > Project Ref, qui doit correspondre à NEXT_PUBLIC_SUPABASE_URL).';
  end if;
end $$;

alter table public.outfits
  add column if not exists video_url text null;

alter table public.outfits
  add column if not exists video_public_id text null;

comment on column public.outfits.video_url is 'IMPL-C : URL de livraison Cloudinary (MP4 H.264/AAC) — vidéo optionnelle du look, présentée en premier dans la modale d''inspection publique.';

comment on column public.outfits.video_public_id is 'IMPL-C : identifiant public Cloudinary pour suppression lors du remplacement ou du retrait de la vidéo.';

commit;
