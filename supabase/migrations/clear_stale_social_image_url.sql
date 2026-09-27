-- Perscadors — IMPL-A (UI Boost 09/2026) : neutralise la valeur périmée de
-- social_image_url qui écrasait la bannière de partage configurée.
--
-- Contexte (cause racine, cf. audit Phase 7) : normalizeShopSettings remplissait
-- social_image_url absent par une image codée en dur
-- (/assets/collections/articles/BASKET POUR HOMME/IMG-20251014-WA0036.jpg),
-- et upsertShopSettings persistait l'objet complet -> chaque sauvegarde des
-- Réglages réécrivait cette ancienne image en base, où elle était PRIORITAIRE
-- sur la bannière de Médias dans les métadonnées OG (layout.tsx).
--
-- Le code est corrigé (plus aucun défaut écrit ; la bannière Médias est la
-- source de vérité). Cette migration nettoie la valeur périmée ÉVENTUELLEMENT
-- déjà présente : elle ne met à NULL que si la colonne contient exactement
-- l'ancienne image codée en dur — toute valeur explicitement choisie est
-- préservée.
--
-- PRÉREQUIS : projet Supabase de PRODUCTION (Project Ref = NEXT_PUBLIC_SUPABASE_URL).
--
-- Rollback : aucune action nécessaire (les métadonnées retombent sur la
-- bannière Médias ou le fallback du layout). Pour rétablir explicitement une
-- valeur : update public.shop_settings set social_image_url = '<url>' where id;

begin;

-- Garde anti-mauvais-projet (retour d'expérience consolidation 09/2026).
do $$
begin
  if to_regclass('public.shop_settings') is null then
    raise exception 'PRÉREQUIS ABSENT : la table public.shop_settings n''existe pas dans cette base — vous n''êtes probablement pas sur le bon projet Supabase. Vérifiez le sélecteur de projet (et Project Settings > API > Project Ref, qui doit correspondre à NEXT_PUBLIC_SUPABASE_URL).';
  end if;
end $$;

update public.shop_settings
  set social_image_url = null
  where social_image_url = '/assets/collections/articles/BASKET POUR HOMME/IMG-20251014-WA0036.jpg';

commit;
