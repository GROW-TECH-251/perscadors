-- Perscadors — IMPL-2 (consolidation 09/2026) : composition publique des HP Looks.
-- Décision C2 : un article MASQUÉ sélectionné dans un look DOIT apparaître dans
-- la composition publique de ce look, SANS redevenir visible au catalogue.
--
-- Pourquoi une fonction : la policy products_public_read_visible
-- (using visible = true) interdit à la clé anon de lire les articles masqués —
-- c'est voulu (aucune fuite du catalogue masqué vers le public). Cette fonction
-- SECURITY DEFINER n'expose QUE les articles masqués référencés par au moins un
-- look VISIBLE, limités aux champs nécessaires à l'affichage de la composition
-- et au panier « Recréer ce look » (photo, nom, catégorie, prix, tailles,
-- couleurs, stock). Aucun autre article masqué n'est lisible via cette RPC.
--
-- Résilience : tant que cette fonction n'existe pas (migration non exécutée),
-- l'application retombe sur le comportement historique (composition limitée au
-- catalogue visible) — aucun ordre de déploiement n'est imposé.
--
-- Rollback : drop function if exists public.get_outfit_composition_products();
-- (l'application retombe automatiquement sur le comportement historique).
--
-- PRÉREQUIS : exécuter dans le projet Supabase de PRODUCTION — celui dont
-- l'URL correspond à NEXT_PUBLIC_SUPABASE_URL (Vercel → Settings → Environment
-- Variables). Dans un autre projet ou une branche preview (base vide), la
-- création échoue avec « relation "public.products" does not exist » (42P01).

begin;

-- Garde-fou (retour d'expérience 09/2026) : échouer IMMÉDIATEMENT avec un
-- message explicite si la base visée n'est pas la bonne (tables absentes),
-- au lieu du « relation "public.products" does not exist » (42P01) difficile
-- à interpréter. Ne modifie rien : simple vérification.
do $$
begin
  if to_regclass('public.products') is null or to_regclass('public.outfits') is null then
    raise exception 'PRÉREQUIS ABSENT : la table public.products ou public.outfits n''existe pas dans cette base — vous n''êtes probablement pas sur le bon projet Supabase. Vérifiez le sélecteur de projet (et Project Settings > API > Project Ref, qui doit correspondre à NEXT_PUBLIC_SUPABASE_URL).';
  end if;
end $$;

create or replace function public.get_outfit_composition_products()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(distinct jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'price', p.price,
      'category', p.category,
      'image_url', p.image_url,
      'images', coalesce(to_jsonb(p.images), '[]'::jsonb),
      'sizes', coalesce(to_jsonb(p.sizes), '[]'::jsonb),
      'colors', coalesce(to_jsonb(p.colors), '[]'::jsonb),
      'stock', p.stock
    )),
    '[]'::jsonb
  )
  from public.products p
  where p.visible = false
    and exists (
      select 1
      from public.outfits o
      cross join lateral jsonb_array_elements_text(coalesce(o.product_ids, '[]'::jsonb)) as pid(value)
      where o.visible = true
        and pid.value = p.id::text
    );
$$;

-- Lecture publique : la composition des looks visibles est publique par nature
-- (elle s'affiche sur la vitrine) ; le reste du catalogue masqué reste protégé.
grant execute on function public.get_outfit_composition_products() to anon, authenticated;

commit;
