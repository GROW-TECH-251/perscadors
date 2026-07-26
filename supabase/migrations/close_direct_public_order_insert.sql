-- Les commandes publiques passent désormais par /api/checkout, qui vérifie
-- Turnstile côté serveur avant d'utiliser la clé service_role.
begin;
drop policy if exists orders_public_insert on public.orders;
commit;
