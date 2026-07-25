-- Perscadors — aligne orders avec le contrat AdminOrder actuel.
-- Corrige l'absence de subtotal constatée pendant la synchronisation WhatsApp.

begin;

alter table public.orders
  add column if not exists order_number text,
  add column if not exists status text not null default 'EN ATTENTE',
  add column if not exists client_name text not null default '',
  add column if not exists client_phone text not null default '',
  add column if not exists client_area text not null default '',
  add column if not exists items jsonb not null default '[]'::jsonb,
  add column if not exists history jsonb not null default '[]'::jsonb,
  add column if not exists subtotal numeric not null default 0,
  add column if not exists delivery_fee numeric not null default 0,
  add column if not exists total numeric not null default 0,
  add column if not exists grand_total numeric not null default 0,
  add column if not exists idempotency_key uuid,
  add column if not exists sync_status text not null default 'synced',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.orders
set
  subtotal = coalesce(nullif(subtotal, 0), total, grand_total, 0),
  grand_total = coalesce(nullif(grand_total, 0), total, subtotal, 0),
  delivery_fee = coalesce(delivery_fee, 0),
  history = coalesce(history, '[]'::jsonb),
  items = coalesce(items, '[]'::jsonb);

create unique index if not exists orders_idempotency_key_unique
  on public.orders (idempotency_key)
  where idempotency_key is not null;
create unique index if not exists orders_order_number_unique
  on public.orders (order_number)
  where order_number is not null;

commit;
