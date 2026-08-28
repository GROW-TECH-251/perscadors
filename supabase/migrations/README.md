# Migrations Supabase — Perscadors

Les scripts de ce dossier sont versionnés avec le code applicatif. Ils doivent être appliqués dans l'ordre chronologique sur l'instance Supabase de l'environnement concerné.

## Appliquer une migration

Avant toute exécution en production :

1. sauvegarder la base ou vérifier le point de restauration ;
2. exécuter le script dans **Supabase Dashboard → SQL Editor** ou avec la CLI Supabase ;
3. vérifier que la requête s'est terminée sans erreur ;
4. contrôler les index et contraintes créés ;
5. déployer ensuite la version applicative qui dépend de la migration.

## Migration des commandes idempotentes

`evolution_public.orders.sql` ajoute :

- `idempotency_key` : clé UUID technique anti-doublon ;
- `sync_status` : état de persistance (`synced`, `pending_sync`, `sync_failed`) ;
- des index uniques sur `idempotency_key` et `order_number` ;
- un index destiné au suivi des commandes par état de synchronisation.

La migration échoue volontairement si des `order_number` historiques sont dupliqués. Corriger ces doublons avant de la relancer : ne jamais supprimer ou modifier des commandes de production sans export de sauvegarde et validation métier.

## Migration de sécurité — `restrict_profile_role_updates.sql`

Cette migration supprime la policy permissive `profiles_update_own` (UPDATE de sa propre ligne `public.profiles` sans restriction de colonnes), qui permettait à un utilisateur authentifié de s'auto-promouvoir `admin`.

**Important** : elle doit être appliquée **après** `normalize_rls_crud_storage.sql` (qui crée cette policy). Si `normalize_rls_crud_storage.sql` était ré-exécutée après coup, la policy permissive serait recréée — il faudrait alors ré-appliquer `restrict_profile_role_updates.sql`.
