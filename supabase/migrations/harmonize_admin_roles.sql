-- Perscadors exploite actuellement un seul niveau d'administration : admin.
-- Les éventuels anciens superadmin sont convertis afin de préserver leur accès
-- sans conserver deux interprétations concurrentes des rôles.

begin;

update public.profiles
set role = 'admin'
where role = 'superadmin';

create or replace function public.is_perscadors_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$function$;

-- Compatibilité temporaire avec les appels historiques : les deux fonctions
-- retournent désormais exactement la même décision d'autorisation.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select public.is_perscadors_admin();
$function$;

-- Supprime les policies historiques qui appelaient is_admin() directement.
drop policy if exists "Authenticated admin can manage customers" on public.customers;
drop policy if exists "Admin can view analytics" on public.analytics_events;

create policy customers_admin_manage
on public.customers
for all
to authenticated
using (public.is_perscadors_admin())
with check (public.is_perscadors_admin());

create policy analytics_events_admin_read
on public.analytics_events
for select
to authenticated
using (public.is_perscadors_admin());

commit;
