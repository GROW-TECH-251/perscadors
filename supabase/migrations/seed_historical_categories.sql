-- E10 : source de vérité unique pour les catégories.
-- 1) Insère les 4 catégories historiques (codées en dur depuis l'origine)
--    SI ABSENTES, avec leurs métadonnées historiques (nom, tagline, image).
--    Si une ligne existe déjà pour le slug, elle est RÉUTILISÉE telle quelle
--    (aucun doublon, aucune écrasement de personnalisation admin).
-- 2) « Adoption » : toute valeur products.category sans ligne dans categories
--    reçoit une ligne visible — aucune catégorie réellement utilisée ne reste
--    inadministrable. AUCUNE donnée produit n'est modifiée.
-- 3) « Autres » (destination E9) est garantie et placée en DERNIÈRE position.
-- Idempotent : ré-exécutable sans doublon (where not exists par slug).
-- PRÉREQUIS : exécuter categories_safe_management.sql (E9) avant celle-ci.
--
-- ROLLBACK éventuel (à exécuter uniquement après identification des lignes
-- créées, p.ex. select category, name, created_at from public.categories
-- order by created_at desc;) :
--   delete from public.categories where category in (
--     'basket-pour-homme','complet-pour-homme','jean-overside-pour-homme',
--     'tapettes-pour-homme') and created_at > '<horodatage du seed>';
--   -- les lignes d'adoption portent description = '' et image_url is null.

begin;

-- 1) Les quatre catégories historiques (positions 1 à 4).
insert into public.categories (name, category, description, image_url, visible, position, created_at, updated_at)
select * from (values
  ('Baskets Homme', 'basket-pour-homme', 'Des kicks premium pour imposer ton style partout à Cotonou.', '/assets/collections/articles/BASKET POUR HOMME/IMG-20251014-WA0012.jpg', true, 1, now(), now()),
  ('Complets Streetwear', 'complet-pour-homme', 'Oversize, monogrammes et ensembles premium validés par Vioutou.', '/assets/collections/articles/COMPLET POUR HOMME/IMG-20251014-WA0006.jpg', true, 2, now(), now()),
  ('Jeans Oversize', 'jean-overside-pour-homme', 'Des coupes larges et premium pensées pour les vrais looks streetwear.', '/assets/collections/articles/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0037.jpg', true, 3, now(), now()),
  ('Tapettes & Sandales', 'tapettes-pour-homme', 'Confort premium, daim et finitions haut de gamme pour les sorties chill.', '/assets/collections/articles/TAPETTES POUR HOMME/IMG-20251014-WA0026.jpg', true, 4, now(), now())
) as seed(name, category, description, image_url, visible, position, created_at, updated_at)
where not exists (
  select 1 from public.categories c where c.category = seed.category
);

-- 2) Adoption : une ligne pour chaque slug produit encore orphelin.
insert into public.categories (name, category, description, image_url, visible, position, created_at, updated_at)
select initcap(replace(p.category, '-', ' ')), p.category, '', null, true,
       coalesce((select max(position) from public.categories), 0)
         + row_number() over (order by p.category),
       now(), now()
from (
  select distinct category from public.products
  where category <> ''
    and category is not null
) p
where not exists (
  select 1 from public.categories c where c.category = p.category
);

-- 3) Garantie + repositionnement de « Autres » en fin d'ordre.
insert into public.categories (name, category, description, image_url, visible, position, created_at, updated_at)
select 'Autres', 'autres', '', null, true, 999999, now(), now()
where not exists (select 1 from public.categories where category = 'autres');

update public.categories
   set position = (select coalesce(max(position), 0) + 1 from public.categories c where c.category <> 'autres'),
       updated_at = now()
 where category = 'autres';

commit;
