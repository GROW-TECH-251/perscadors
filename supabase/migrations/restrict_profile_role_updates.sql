 -- Perscadors — SEC-3 : interdit l'auto-élévation des rôles
-- ============================================================
-- Historique : ce fichier a été créé VIDE par le commit b695a72
-- ("fix(security): interdit l auto elevation des rôles"). N'ayant jamais
-- contenu d'instruction, il n'a jamais produit d'effet en base. On le
-- complète ici avec le correctif réel.
--
-- Problème : normalize_rls_crud_storage.sql crée la policy
--   profiles_update_own → UPDATE sur public.profiles
--   using (id = auth.uid()) with check (id = auth.uid())
-- sans restriction de colonnes. Tout utilisateur authentifié peut donc
-- exécuter :
--   update public.profiles set role = 'admin' where id = auth.uid();
-- et s'auto-promouvoir administrateur (CRUD complet + APIs Cloudinary).
--
-- Correctif : suppression de cette policy permissive. La gestion des profils
-- reste réservée aux administrateurs via profiles_admin_manage, vérifiée par
-- public.is_perscadors_admin(). Les utilisateurs conservent profiles_read_own
-- (lecture de leur propre ligne), utilisée par le middleware et les contrôles
-- de rôle. Aucune policy d'auto-update n'est recréée : l'application ne
-- propose aucun flux d'édition de profil côté utilisateur.
--
-- Idempotent : peut être ré-exécutée sans effet de bord.

begin;

-- 1. Suppression déterministe de la policy permissive connue.
drop policy if exists profiles_update_own on public.profiles;

-- 2. Défense en profondeur : retire toute policy UPDATE résiduelle sur
--    public.profiles autre que la gestion admin. La vue pg_policies expose
--    cmd en texte : 'SELECT', 'INSERT', 'UPDATE', 'DELETE' ou 'ALL'.
--    profiles_admin_manage (ALL) est donc épargnée, profiles_read_own (SELECT) aussi.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'UPDATE'
      and policyname <> 'profiles_admin_manage'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_record.policyname);
  end loop;
end $$;

commit;
