-- Perscadors — Audit RLS / CRUD / Storage / Realtime
-- Script de lecture uniquement : aucune donnée ni policy n'est modifiée.

-- 1. Tables applicatives et RLS
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('orders', 'products', 'categories', 'content_posts', 'outfits', 'site_assets', 'shop_settings', 'customer_meta', 'profiles')
order by c.relname;

-- 2. Policies RLS des tables applicatives
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('orders', 'products', 'categories', 'content_posts', 'outfits', 'site_assets', 'shop_settings', 'customer_meta', 'profiles')
order by tablename, policyname;

-- 3. Colonnes, PK et contraintes
select
  tc.table_name,
  tc.constraint_type,
  tc.constraint_name,
  kcu.column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
where tc.table_schema = 'public'
  and tc.table_name in ('orders', 'products', 'categories', 'content_posts', 'outfits', 'site_assets', 'shop_settings', 'customer_meta', 'profiles')
order by tc.table_name, tc.constraint_type, tc.constraint_name;

-- 4. Index existants
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('orders', 'products', 'categories', 'content_posts', 'outfits', 'site_assets', 'shop_settings', 'customer_meta', 'profiles')
order by tablename, indexname;

-- 5. Buckets Storage
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by name;

-- 6. Policies Storage
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- 7. Tables Realtime
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by schemaname, tablename;

-- 8. Rôles administrateurs
select p.role, count(*) as users_count
from public.profiles p
group by p.role
order by p.role;
