-- E9 : gestion complète et sûre des catégories intégrée à Produits.
-- Renommage avec propagation du slug aux produits + redirection des anciens
-- slugs ; suppression atomique avec transfert des produits vers « Autres ».
-- Les fonctions retournent des codes (jsonb) plutôt que des exceptions pour
-- ne jamais exposer un message PostgreSQL brut à l'interface.

begin;

-- Anciens slugs conservés pour les redirections publiques (/categorie/[slug]).
alter table public.categories
  add column if not exists former_slugs text[] not null default '{}';

-- Filet de sécurité : garantir l'existence de la catégorie « Autres »
-- (destination obligatoire des transferts lors d'une suppression).
insert into public.categories (name, category, description, image_url, visible, position, created_at, updated_at)
select 'Autres', 'autres', '', null, true,
       coalesce((select max(position) from public.categories), 0) + 1,
       now(), now()
where not exists (select 1 from public.categories where category = 'autres');

-- Renomme une catégorie (libellé + slug) et propage le nouveau slug à tous
-- ses produits, dans une transaction unique (tout ou rien). L'ancien slug est
-- conservé dans former_slugs pour la redirection publique.
create or replace function public.admin_rename_category(p_id int, p_name text, p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_current public.categories%rowtype;
  v_name text := btrim(p_name);
  v_slug text := lower(btrim(p_slug));
  v_moved int := 0;
begin
  if not public.is_perscadors_admin() then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;
  if v_name = '' or length(v_name) > 100 then
    return jsonb_build_object('ok', false, 'code', 'invalid_name');
  end if;
  if v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    return jsonb_build_object('ok', false, 'code', 'invalid_slug');
  end if;

  select * into v_current from public.categories where id = p_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  -- « Autres » est une catégorie système : son slug ne change jamais (les
  -- produits y sont transférés par slug) ; seul son libellé peut évoluer.
  if v_current.category = 'autres' and v_slug <> 'autres' then
    return jsonb_build_object('ok', false, 'code', 'protected_slug');
  end if;

  if v_slug <> v_current.category
     and exists (select 1 from public.categories where category = v_slug and id <> p_id) then
    return jsonb_build_object('ok', false, 'code', 'duplicate');
  end if;

  if v_slug = v_current.category then
    update public.categories set name = v_name, updated_at = now() where id = p_id;
    return jsonb_build_object('ok', true, 'slug', v_slug, 'moved_products', 0);
  end if;

  update public.products
     set category = v_slug
   where category = v_current.category;
  get diagnostics v_moved = row_count;

  update public.categories
     set name = v_name,
         category = v_slug,
         former_slugs = (
           select coalesce(array_agg(distinct s), '{}'::text[])
             from unnest(array_append(v_current.former_slugs, v_current.category)) as s
            where s <> v_slug
         ),
         updated_at = now()
   where id = p_id;

  return jsonb_build_object('ok', true, 'slug', v_slug, 'moved_products', v_moved);
end;
$function$;

-- Supprime une catégorie APRÈS avoir transféré ses produits vers « Autres »,
-- en une transaction unique. Refuse « Autres » elle-même et bloque avec un
-- code explicite si aucune catégorie de destination sûre n'existe.
create or replace function public.admin_delete_category(p_id int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_category public.categories%rowtype;
  v_moved int := 0;
begin
  if not public.is_perscadors_admin() then
    return jsonb_build_object('ok', false, 'code', 'forbidden');
  end if;

  select * into v_category from public.categories where id = p_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_category.category = 'autres' then
    return jsonb_build_object('ok', false, 'code', 'protected');
  end if;

  if not exists (select 1 from public.categories where category = 'autres' and id <> p_id) then
    return jsonb_build_object('ok', false, 'code', 'no_autres');
  end if;

  update public.products
     set category = 'autres'
   where category = v_category.category;
  get diagnostics v_moved = row_count;

  delete from public.categories where id = p_id;

  return jsonb_build_object('ok', true, 'moved_products', v_moved);
end;
$function$;

-- Réservé aux utilisateurs authentifiés (la garde is_perscadors_admin()
-- contrôle ensuite les droits réels à l'exécution).
revoke execute on function public.admin_rename_category(int, text, text) from anon, public;
revoke execute on function public.admin_delete_category(int) from anon, public;
grant execute on function public.admin_rename_category(int, text, text) to authenticated;
grant execute on function public.admin_delete_category(int) to authenticated;

commit;
