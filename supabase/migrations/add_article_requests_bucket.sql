-- Perscadors — Bucket article-requests pour demandes d'articles non trouvés
-- Contexte : fonctionnalité ArticleRequestSection permet au visiteur d'uploader une photo
-- pour demander un article non présent. L'upload doit être possible en anonyme (public)
-- mais avec RLS restrictive : anon peut INSERT dans article-requests, public peut SELECT,
-- mais pas de UPDATE/DELETE anonyme. Les admins peuvent tout via is_perscadors_admin().

begin;

-- Créer le bucket s'il n'existe pas (via storage.buckets)
insert into storage.buckets (id, name, public)
values ('article-requests', 'article-requests', true)
on conflict (id) do nothing;

-- Supprimer les anciennes policies sur ce bucket si elles existent
drop policy if exists "article_requests_public_read" on storage.objects;
drop policy if exists "article_requests_anon_insert" on storage.objects;
drop policy if exists "article_requests_admin_manage" on storage.objects;

-- Lecture publique pour les fichiers de ce bucket (pour que le lien WhatsApp fonctionne)
create policy "article_requests_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'article-requests');

-- Insertion anonyme autorisée pour les demandes d'articles (public peut uploader)
-- On limite aux dossiers article-requests/* et on check que le fichier est une image
create policy "article_requests_anon_insert"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'article-requests'
  and (storage.foldername(name))[1] = 'requests'
);

-- Gestion admin complète pour ce bucket
create policy "article_requests_admin_manage"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'article-requests'
  and public.is_perscadors_admin()
)
with check (
  bucket_id = 'article-requests'
  and public.is_perscadors_admin()
);

commit;

-- Vérification :
-- SELECT * FROM storage.buckets WHERE id='article-requests'; -- doit exister, public true
-- SELECT policyname FROM pg_policies WHERE tablename='objects' AND policyname LIKE 'article_requests%'; -- 3 policies
