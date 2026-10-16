-- Migration LOT 3 (10/2026) — classification des produits par public cible
-- ============================================================================
-- OBJECTIF : ajouter la colonne `products.target_audience` ('homme' |
--   'femme' | 'unisexe') alimentée EXCLUSIVEMENT par l'administrateur via le
--   formulaire produit. Les pages catégorie filtrent ensuite Homme/Femme
--   (Homme actif par défaut) ; un article unisexe apparaît dans les DEUX
--   vues, sans doublon.
--
-- ORDRE DE DÉPLOIEMENT (critique) : exécuter CE SCRIPT AVANT de déployer le
--   code qui l'exploite. Le code applicatif est toutefois tolérant :
--   sans la colonne, l'ancien comportement (catalogue complet, sans filtre
--   public) reste fonctionnel côté lecture tant que la colonne est absente,
--   mais l'admin ne peut plus créer/modifier de produit tant qu'elle manque
--   (PostgREST rejetterait `target_audience` inconnu). D'où : SQL d'abord.
--
-- COMPATIBILITÉ / IMPACT :
--   - AUCUNE donnée existante n'est modifiée : PAS de backfill, PAS de
--     classification arbitraire (règle stricte : jamais deviner « homme »
--     pour éviter les NULL — les produits existants seront classés
--     manuellement, un par un, via l'admin).
--   - Comportement transitoire : target_audience NULL = produit visible
--     dans les DEUX vues publiques (Homme et Femme) jusqu'à classification.
--   - Contrainte CHECK : seuls 'homme', 'femme', 'unisexe' ou NULL.
--   - Requêtes applicatives : toutes en `select('*')` → aucun changement
--     requis côté services ; les vues/RLS existantes ne sont pas touchées.
--   - Taille / durée : instantané (table petite), verrou ACCESS EXCLUSIVE
--     bref sur `products` (add column nullable sans défaut = non bloquant).
--
-- ROLLBACK : `alter table public.products drop column if exists target_audience;`
--   (perte des classifications saisies — exporter la colonne avant si besoin).

alter table public.products
  add column if not exists target_audience text;

alter table public.products
  drop constraint if exists products_target_audience_check;

alter table public.products
  add constraint products_target_audience_check
  check (target_audience is null or target_audience in ('homme', 'femme', 'unisexe'));

comment on column public.products.target_audience is
  'Public cible : homme | femme | unisexe. NULL = non classé (transitoire : visible dans les deux vues publiques Homme/Femme jusqu''à classification manuelle par l''admin). Alimenté uniquement via le formulaire admin — jamais déduit du nom/description/catégorie.';
