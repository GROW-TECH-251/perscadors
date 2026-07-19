-- Perscadors — commandes fiables et idempotentes
--
-- Pré-requis : la table public.orders existe déjà.
-- Cette migration est transactionnelle : si des numéros de commande historiques
-- sont dupliqués, l'index unique ne sera pas créé et aucune modification partielle
-- ne sera conservée. Corriger les doublons avant de relancer la migration.

begin;

alter table public.orders
  add column if not exists idempotency_key uuid,
  add column if not exists sync_status text not null default 'synced';

alter table public.orders
  drop constraint if exists orders_sync_status_check;

alter table public.orders
  add constraint orders_sync_status_check
  check (sync_status in ('synced', 'pending_sync', 'sync_failed'));

-- Les anciennes commandes n'ont pas de clé d'idempotence : elles restent valides.
-- La contrainte s'applique à chaque nouvelle commande qui fournit une clé.
create unique index if not exists orders_idempotency_key_unique
  on public.orders (idempotency_key)
  where idempotency_key is not null;

-- order_number est la référence métier affichée au client et au commerçant.
-- Cette contrainte bloque les doublons accidentels dès la base de données.
create unique index if not exists orders_order_number_unique
  on public.orders (order_number)
  where order_number is not null;

create index if not exists orders_sync_status_created_at_idx
  on public.orders (sync_status, created_at desc);

commit;
