-- Perscadors — Normalisation RLS CRUD et Storage
-- Basé sur l'audit du 22/07/2026 : les policies permissives publiques
-- "Allow all" et "Accès universel" rendaient RLS inefficace.

begin;

-- Fonction admin utilisée par les tables publiques et Storage.
create or replace function public.is_perscadors_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'superadmin')
  );
$$;

-- Retire toutes les policies permissives historiques des tables applicatives ciblées.
do $$
declare policy_record record;
begin
  for policy_record in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('orders', 'products', 'categories', 'content_posts', 'outfits', 'site_assets', 'shop_settings', 'customer_meta', 'profiles')
  loop
    execute format('drop policy if exists %I on public.%I', policy_record.policyname, policy_record.tablename);
  end loop;
end $$;

-- Lecture publique limitée aux éléments réellement publiables.
create policy products_public_read_visible on public.products for select to anon, authenticated using (visible = true);
create policy categories_public_read_visible on public.categories for select to anon, authenticated using (visible = true);
create policy content_public_read_published on public.content_posts for select to anon, authenticated using (status = 'published');
create policy outfits_public_read_visible on public.outfits for select to anon, authenticated using (visible = true);
create policy site_assets_public_read on public.site_assets for select to anon, authenticated using (true);
create policy shop_settings_public_read on public.shop_settings for select to anon, authenticated using (true);

-- Checkout : création uniquement, sans lecture ni modification publique.
create policy orders_public_insert on public.orders for insert to anon, authenticated
with check (status = 'EN ATTENTE');

-- Gestion globale réservée aux administrateurs réels.
create policy orders_admin_manage on public.orders for all to authenticated using (public.is_perscadors_admin()) with check (public.is_perscadors_admin());
create policy products_admin_manage on public.products for all to authenticated using (public.is_perscadors_admin()) with check (public.is_perscadors_admin());
create policy categories_admin_manage on public.categories for all to authenticated using (public.is_perscadors_admin()) with check (public.is_perscadors_admin());
create policy content_posts_admin_manage on public.content_posts for all to authenticated using (public.is_perscadors_admin()) with check (public.is_perscadors_admin());
create policy outfits_admin_manage on public.outfits for all to authenticated using (public.is_perscadors_admin()) with check (public.is_perscadors_admin());
create policy site_assets_admin_manage on public.site_assets for all to authenticated using (public.is_perscadors_admin()) with check (public.is_perscadors_admin());
create policy shop_settings_admin_manage on public.shop_settings for all to authenticated using (public.is_perscadors_admin()) with check (public.is_perscadors_admin());
create policy customer_meta_admin_manage on public.customer_meta for all to authenticated using (public.is_perscadors_admin()) with check (public.is_perscadors_admin());
create policy profiles_admin_manage on public.profiles for all to authenticated using (public.is_perscadors_admin()) with check (public.is_perscadors_admin());
create policy profiles_read_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Supprime les 40 policies Storage historiques, incluant les ALL {public} dangereux.
do $$
declare policy_record record;
begin
  for policy_record in
    select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format('drop policy if exists %I on storage.objects', policy_record.policyname);
  end loop;
end $$;

-- Tous les fichiers publics peuvent être lus, aucun accès public en écriture.
create policy storage_public_read_known_buckets on storage.objects for select to anon, authenticated
using (bucket_id = any (array['brand-assets', 'content-images', 'events', 'gallery', 'hero-media', 'outfits-collection', 'product-images', 'shop_settings', 'site-media']));

-- Écriture Storage uniquement pour admin/superadmin et uniquement sur les buckets Perscadors.
create policy storage_admin_manage_known_buckets on storage.objects for all to authenticated
using (
  bucket_id = any (array['brand-assets', 'content-images', 'events', 'gallery', 'hero-media', 'outfits-collection', 'product-images', 'shop_settings', 'site-media'])
  and public.is_perscadors_admin()
)
with check (
  bucket_id = any (array['brand-assets', 'content-images', 'events', 'gallery', 'hero-media', 'outfits-collection', 'product-images', 'shop_settings', 'site-media'])
  and public.is_perscadors_admin()
);

commit;
