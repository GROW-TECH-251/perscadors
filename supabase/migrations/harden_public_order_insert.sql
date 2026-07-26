-- Réduit l'abus du point d'entrée public de checkout sans ouvrir de lecture
-- ou de modification anonyme des commandes.
-- La limitation de débit durable reste à appliquer au niveau Supabase/WAF.

begin;

drop policy if exists orders_public_insert on public.orders;

create policy orders_public_insert
on public.orders
for insert
to anon, authenticated
with check (
  status = 'EN ATTENTE'
  and char_length(trim(client_name)) between 2 and 120
  and char_length(trim(client_area)) between 2 and 160
  and char_length(coalesce(client_phone, '')) <= 24
  and jsonb_typeof(items) = 'array'
  and jsonb_array_length(items) between 1 and 20
  and subtotal >= 0
  and subtotal <= 100000000
  and delivery_fee >= 0
  and delivery_fee <= 10000000
  and total = subtotal + delivery_fee
  -- idempotency_key est de type UUID dans le schéma : PostgreSQL valide
  -- déjà son format avant l'évaluation de cette policy.
);

commit;
