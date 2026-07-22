-- Perscadors — table de médias et synchronisation Realtime
-- Compatible avec une base où public.site_assets n'a pas encore été créée.

begin;

create table if not exists public.site_assets (
  id text primary key,
  type text not null check (type in ('image', 'video')),
  section text not null,
  url text not null,
  storage_path text,
  alt text not null default 'HP Collection Media',
  title text not null default 'Média Boutique',
  description text,
  active boolean not null default true,
  order_index integer not null default 1,
  is_social_url boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_assets_section_active
  on public.site_assets(section, active);
create index if not exists idx_site_assets_order
  on public.site_assets(order_index);

create or replace function public.set_site_assets_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_assets_updated_at on public.site_assets;
create trigger site_assets_updated_at
before update on public.site_assets
for each row
execute function public.set_site_assets_updated_at();

alter table public.site_assets enable row level security;

-- Lecture publique pour permettre l'affichage de la vitrine.
drop policy if exists "site_assets_public_read" on public.site_assets;
create policy "site_assets_public_read"
on public.site_assets
for select
to anon, authenticated
using (true);

-- Écriture réservée aux administrateurs définis dans public.profiles.
drop policy if exists "site_assets_admin_manage" on public.site_assets;
create policy "site_assets_admin_manage"
on public.site_assets
for all
to authenticated
using (public.is_perscadors_admin())
with check (public.is_perscadors_admin());

alter table public.shop_settings replica identity full;
alter table public.site_assets replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and pr.prrelid = 'public.shop_settings'::regclass
  ) then
    alter publication supabase_realtime add table public.shop_settings;
  end if;

  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime'
      and pr.prrelid = 'public.site_assets'::regclass
  ) then
    alter publication supabase_realtime add table public.site_assets;
  end if;
end $$;

commit;
