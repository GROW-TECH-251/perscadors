-- Ferme deux policies historiques qui accordaient ALL à tout utilisateur authentifié.
-- Les écritures restent réservées aux rôles admin/superadmin définis dans profiles.

begin;

drop policy if exists "Allow authenticated admins full write access to site_media" on public.site_media;
drop policy if exists "Authenticated admin can manage testimonials" on public.testimonials;

create policy site_media_admin_manage
on public.site_media
for all
to authenticated
using (public.is_perscadors_admin())
with check (public.is_perscadors_admin());

create policy testimonials_admin_manage
on public.testimonials
for all
to authenticated
using (public.is_perscadors_admin())
with check (public.is_perscadors_admin());

commit;
