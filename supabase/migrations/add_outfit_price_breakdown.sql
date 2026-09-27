-- Perscadors — IMPL-4 (consolidation 09/2026) : décomposition du forfait HP Look.
-- Décisions C3+C4 : le FORFAIT reste la référence (IMPL-3) ; en dessous, une
-- décomposition libre en lignes « libellé + montant » — JAMAIS de faux articles
-- catalogue (aucune interaction avec products) — dont l'affichage public est
-- CONFIGURABLE par look.
--
-- Ce qui change :
--  1. price_breakdown jsonb (null = pas de décomposition) : tableau d'objets
--     { "label": texte non vide, "amount": nombre >= 0 }.
--  2. show_price_breakdown boolean (défaut false) : interrupteur par look.
--  3. Contrôle structurel en base via fonction immutable : la décomposition
--     invalide est rejetée (format garanti pour le rendu public).
--
-- Le trigger set_outfit_price (v2, IMPL-3) n'est PAS modifié : il se déclenche
-- sur product_ids / pricing_mode uniquement — enregistrer ou modifier une
-- décomposition ne touche JAMAIS au prix du look.
--
-- Compatibilité : colonnes optionnelles, défauts neutres (null / false) ;
-- aucun ordre de déploiement imposé (l'application retombe sur le comportement
-- sans décomposition tant que les colonnes sont absentes ; cf. outfitService).
--
-- PRÉREQUIS : exécuter dans le projet Supabase de PRODUCTION (Project Ref =
-- NEXT_PUBLIC_SUPABASE_URL). La garde ci-dessous échoue avec un message
-- explicite sur un projet/branche sans le schéma.
--
-- Rollback (documenté AVANT exécution) :
--   alter table public.outfits drop constraint if exists outfits_price_breakdown_check;
--   drop function if exists public.outfit_price_breakdown_valid(jsonb);
--   alter table public.outfits drop column if exists price_breakdown;
--   alter table public.outfits drop column if exists show_price_breakdown;
-- (perte des décompositions saisies — l'avertissement UI de bascule de mode
--  et la sauvegarde du forfaitvia IMPL-3 restent intacts.)

begin;

-- Garde anti-mauvais-projet (retour d'expérience IMPL-2 : 42P01 sur un
-- projet/branche sans le schéma).
do $$
begin
  if to_regclass('public.outfits') is null then
    raise exception 'PRÉREQUIS ABSENT : la table public.outfits n''existe pas dans cette base — vous n''êtes probablement pas sur le bon projet Supabase. Vérifiez le sélecteur de projet (et Project Settings > API > Project Ref, qui doit correspondre à NEXT_PUBLIC_SUPABASE_URL).';
  end if;
end $$;

-- 1. Validation structurelle (immutable : utilisable dans un CHECK).
--    null = pas de décomposition ; sinon tableau d'objets {label, amount}
--    avec label texte non vide et amount numérique >= 0.
create or replace function public.outfit_price_breakdown_valid(breakdown jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select breakdown is null or (
    jsonb_typeof(breakdown) = 'array'
    and not exists (
      select 1
      from jsonb_array_elements(breakdown) as line(value)
      where jsonb_typeof(line.value) <> 'object'
         or coalesce(line.value->>'label', '') = ''
         or (line.value->>'amount') is null
         or not (line.value->>'amount') ~ '^[0-9]+(\.[0-9]+)?$'
    )
  );
$$;

-- 2. Colonnes (idempotentes).
alter table public.outfits
  add column if not exists price_breakdown jsonb;

alter table public.outfits
  add column if not exists show_price_breakdown boolean not null default false;

-- 3. Contrainte structurelle (idempotente).
alter table public.outfits drop constraint if exists outfits_price_breakdown_check;
alter table public.outfits
  add constraint outfits_price_breakdown_check
  check (public.outfit_price_breakdown_valid(price_breakdown));

commit;
