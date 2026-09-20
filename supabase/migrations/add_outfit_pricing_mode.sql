-- Perscadors — IMPL-3 (consolidation 09/2026) : prix forfaitaire des HP Looks.
-- Décision C3 : « je veux pouvoir mettre le Prix forfaitaire HP Look » — le
-- forfait est la RÉFÉRENCE (la décomposition détaillée viendra en IMPL-4).
--
-- Aujourd'hui, le trigger set_outfit_price (fix_outfits_identity_and_price.sql)
-- écrase custom_price par la somme des product_ids à CHAQUE insert/update ->
-- impossible de fixer un prix manuel.
--
-- Ce qui change :
--  1. Colonne pricing_mode : 'calculated' (défaut, comportement actuel) ou
--     'flat' (forfait manuel, custom_price devient la référence).
--  2. Contrainte : mode 'flat' exige custom_price non null (intégrité DB).
--  3. Trigger v2 : ne recalcule la somme qu'en mode 'calculated' ; en mode
--     'flat', custom_price passe tel quel (ajustable librement, conservé même
--     si la composition change). Le trigger s'étend aux bascules de mode :
--     repasser en 'calculated' recalcule la somme automatiquement.
--
-- Compatibilité : les lignes existantes deviennent 'calculated' (leur
-- custom_price actuel = déjà la somme) — aucun changement de prix, aucun
-- ordre de déploiement imposé (l'application retombe sur le comportement
-- historique tant que la colonne est absente ; cf. outfitService.ts).
--
-- PRÉREQUIS : exécuter dans le projet Supabase de PRODUCTION (celui dont le
-- Project Ref correspond à NEXT_PUBLIC_SUPABASE_URL). Dans un autre projet
-- ou une branche preview (base vide), la garde ci-dessous échoue avec un
-- message explicite.
--
-- Rollback (documenté AVANT exécution) :
--   alter table public.outfits drop constraint if exists outfits_pricing_mode_check;
--   alter table public.outfits drop column if exists pricing_mode;
--   create or replace function public.set_outfit_price() returns trigger
--   language plpgsql security invoker set search_path = public as $$
--   begin
--     new.custom_price = public.recalculate_outfit_price(new.product_ids);
--     new.updated_at = now();
--     return new;
--   end $$;
--   drop trigger if exists outfits_recalculate_price on public.outfits;
--   create trigger outfits_recalculate_price
--   before insert or update of product_ids on public.outfits
--   for each row execute function public.set_outfit_price();
-- (retour au comportement somme automatique ; les prix forfaitaires sont
--  remplacés par la somme — d'où l'avertissement dans l'UI avant bascule.)

begin;

-- Garde anti-mauvais-projet (retour d'expérience IMPL-2 : 42P01 « relation
-- "public.products" does not exist » sur un projet/branche sans le schéma).
do $$
begin
  if to_regclass('public.outfits') is null then
    raise exception 'PRÉREQUIS ABSENT : la table public.outfits n''existe pas dans cette base — vous n''êtes probablement pas sur le bon projet Supabase. Vérifiez le sélecteur de projet (et Project Settings > API > Project Ref, qui doit correspondre à NEXT_PUBLIC_SUPABASE_URL).';
  end if;
end $$;

-- 1. Colonne du mode de prix (idempotente).
alter table public.outfits
  add column if not exists pricing_mode text not null default 'calculated';

-- 2. Intégrité : valeurs admises + forfait exige un prix (idempotente).
alter table public.outfits drop constraint if exists outfits_pricing_mode_check;
alter table public.outfits
  add constraint outfits_pricing_mode_check
  check (pricing_mode in ('calculated', 'flat') and (pricing_mode = 'calculated' or custom_price is not null));

-- 3. Trigger v2 : somme uniquement en mode calculé ; les basculements de mode
--    (flat -> calculated) redéclenchent bien le recalcul. En mode flat,
--    custom_price traverse tel quel (ajustement libre, conservé même si la
--    composition change).
create or replace function public.set_outfit_price()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.pricing_mode = 'calculated' then
    new.custom_price = public.recalculate_outfit_price(new.product_ids);
  end if;
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists outfits_recalculate_price on public.outfits;
create trigger outfits_recalculate_price
before insert or update of product_ids, pricing_mode on public.outfits
for each row execute function public.set_outfit_price();

commit;
