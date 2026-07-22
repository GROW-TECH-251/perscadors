# Perscadors — Recette multi-utilisateur pré-production

## Préconditions

- Les migrations `20260721010000_secure_orders_multi_admin.sql`, `20260721020000_enable_realtime_settings_media.sql`, `20260722040000_normalize_rls_crud_storage.sql` et `20260722050000_customer_settings_crud_integrity.sql` sont exécutées avec succès.
- Un compte `admin` et, idéalement, un compte `superadmin` existent dans `public.profiles`.
- Trois contextes navigateur indépendants sont ouverts : Client A, Client B et Admin.
- Le serveur local est démarré avec `npm run dev` et les variables Supabase sont présentes dans `.env.local`.

## Cas 1 — Commandes simultanées

1. Client A prépare une commande.
2. Client B prépare une commande différente.
3. Admin ouvre `/admin/commandes` dans un autre navigateur.
4. Vérifier que les deux références apparaissent sans refresh manuel.
5. Admin modifie le statut d'une commande.
6. Vérifier la cohérence du Dashboard, Clients et Analytics.

Résultat attendu : chaque commande est unique, visible dans l'admin et aucun cache local ne remplace la liste Supabase.

## Cas 2 — RLS public commandes

Depuis un navigateur non authentifié, vérifier :

- création de commande autorisée ;
- lecture de `orders` refusée ;
- modification de `orders` refusée ;
- suppression de `orders` refusée.

## Cas 3 — RLS admin commandes

Depuis un compte admin :

- lecture de toutes les commandes autorisée ;
- modification statut autorisée ;
- suppression autorisée ;
- second admin observe le changement via Realtime.

## Cas 4 — CRUD catalogue

- créer produit visible ; vérifier public ;
- masquer produit ; vérifier disparition public ;
- supprimer produit ; vérifier disparition admin/public ;
- créer, masquer puis supprimer une catégorie ;
- créer, masquer puis supprimer un HP Look.

## Cas 5 — Médias et Storage

- uploader une vidéo MP4 H.264 Hero dans `site-media` ;
- l'activer ; vérifier qu'un seul Hero est actif ;
- vérifier Hero public dans un second navigateur ;
- désactiver le média ; vérifier fallback ;
- remplacer un témoignage ; vérifier section publique ;
- vérifier qu'un upload refusé affiche une erreur et ne crée pas de faux succès.

## Cas 6 — Réglages

- modifier Hero, FAQ, WhatsApp, livraison et logo ;
- vérifier présence de la valeur dans `shop_settings` ;
- vérifier le rendu public dans un autre navigateur ;
- simuler une erreur de sauvegarde ; vérifier qu'aucun succès local n'est présenté.

## Cas 7 — Storage RLS

- public : lecture des buckets médias autorisée ;
- public : upload/update/delete refusés ;
- admin : upload/update/delete autorisés sur les buckets Perscadors ;
- vérifier qu'aucune policy `Allow all` ou `Accès universel storage objects` ne subsiste.

## Critères de sortie

- Aucun faux succès CRUD.
- Aucun overlay Runtime Turbopack.
- Toutes les écritures sont visibles depuis une autre session.
- Les données cachées n'apparaissent pas publiquement.
- Les erreurs RLS, réseau et Storage produisent un message métier clair.
