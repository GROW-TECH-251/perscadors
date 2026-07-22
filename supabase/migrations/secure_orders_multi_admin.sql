-- Perscadors: commandes cohérentes multi-admin
-- Pré-requis: public.profiles(id uuid, role text) existe.

create or replace function public.is_perscadors_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

alter table public.orders enable row level security;

-- Lecture et gestion globales réservées aux administrateurs authentifiés.
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all"
on public.orders
for all
to authenticated
using (public.is_perscadors_admin())
with check (public.is_perscadors_admin());

-- Le checkout public peut créer une demande de commande, mais ne peut ni lire ni modifier les commandes.
drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert"
on public.orders
for insert
to anon, authenticated
with check (true);

alter table public.orders replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    where p.pubname = 'supabase_realtime' and pr.prrelid = 'public.orders'::regclass
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
