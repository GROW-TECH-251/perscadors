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
