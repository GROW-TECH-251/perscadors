alter table public.products replica identity full;
alter table public.outfits replica identity full;
alter table public.categories replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_rel pr join pg_publication p on p.oid=pr.prpubid where p.pubname='supabase_realtime' and pr.prrelid='public.products'::regclass) then alter publication supabase_realtime add table public.products; end if;
  if not exists (select 1 from pg_publication_rel pr join pg_publication p on p.oid=pr.prpubid where p.pubname='supabase_realtime' and pr.prrelid='public.outfits'::regclass) then alter publication supabase_realtime add table public.outfits; end if;
  if not exists (select 1 from pg_publication_rel pr join pg_publication p on p.oid=pr.prpubid where p.pubname='supabase_realtime' and pr.prrelid='public.categories'::regclass) then alter publication supabase_realtime add table public.categories; end if;
end $$;
