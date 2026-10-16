-- Migration LOT 3 (10/2026, forme finale) — public cible des produits
-- ============================================================================
-- OBJECTIF : colonne `products.target_audience` ('homme' | 'femme' |
--   'unisexe') avec DÉFAUT 'homme' : un produit oublié/non classé est un
--   produit HOMME (décision propriétaire 16/10) — il ne s'affiche PLUS des
--   deux côtés. Seuls les articles 'unisexe' restent visibles dans les DEUX
--   vues publiques (Homme et Femme).
--
-- ÉTAT INITIAL SUPPOSÉ : la 1re version de cette migration (colonne + CHECK)
--   a déjà été exécutée en production et chaque produit a été classé à la
--   main par le propriétaire. Ce script est IDEMPOTENT : il peut être
--   (re)exécuté sans risque quel que soit l'état de départ.
--
-- COMPATIBILITÉ / IMPACT :
--   - `add column if not exists` / `drop constraint if exists` : no-op si
--     déjà en place.
--   - `update ... where target_audience is null` : rattrape UNIQUEMENT les
--     produits restés NULL. Ce n'est pas une classification arbitraire :
--     la règle métier est « défaut = Homme » (autorisée par le propriétaire).
--   - `set default 'homme'` + `set not null` : toute insertion future sans
--     public cible (SQL direct, import, ancien code) atterrit sur Homme.
--   - Le code applicatif envoie déjà la valeur (select admin pré-sélectionné
--     sur Homme) : aucun rejet attendu au déploiement.
--   - Durée : instantané (petite table), verrous brefs.
--
-- ROLLBACK :
--   alter table public.products alter column target_audience drop not null;
--   alter table public.products alter column target_audience drop default;
--   (les classifications déjà saisies restent intactes)

-- 1. Colonne (no-op si déjà présente)
alter table public.products
  add column if not exists target_audience text;

-- 2. Contrainte CHECK (seuls les 3 publics métier, ou NULL avant le rattrapage)
alter table public.products
  drop constraint if exists products_target_audience_check;

alter table public.products
  add constraint products_target_audience_check
  check (target_audience is null or target_audience in ('homme', 'femme', 'unisexe'));

-- 3. Défaut propriétaire : tout produit non classé est un produit HOMME
alter table public.products
  alter column target_audience set default 'homme';

-- 4. Rattrapage des NULL résiduels (uniquement les non-classés)
update public.products
  set target_audience = 'homme'
  where target_audience is null;

-- 5. Intégrité : plus jamais de NULL
alter table public.products
  alter column target_audience set not null;

comment on column public.products.target_audience is
  'Public cible : homme | femme | unisexe (défaut homme, NOT NULL). Unisexe = visible dans les deux vues publiques. Alimenté via le formulaire admin (pré-sélectionné Homme) — jamais déduit du nom/description/catégorie.';

-- VÉRIFICATION POST-EXÉCUTION :
--   select target_audience, count(*) from public.products group by 1 order by 1;
--   Attendu : uniquement homme / femme / unisexe — AUCUNE ligne NULL.
