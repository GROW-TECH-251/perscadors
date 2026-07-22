-- Perscadors — aligne shop_settings avec le contrat TypeScript actuel.
-- Corrige notamment l'absence de delivery_time observée en localhost.

begin;

alter table public.shop_settings
  add column if not exists shop_name text not null default 'HP Collection',
  add column if not exists whatsapp_phone text not null default '',
  add column if not exists driver_phone text default '',
  add column if not exists currency text not null default 'FCFA',
  add column if not exists country text not null default 'Bénin',
  add column if not exists delivery_zones jsonb not null default '[]'::jsonb,
  add column if not exists delivery_free_threshold numeric not null default 0,
  add column if not exists delivery_time text not null default '24h/48h',
  add column if not exists order_followup_template text not null default '',
  add column if not exists order_confirmed_template text not null default '',
  add column if not exists order_delivered_template text not null default '',
  add column if not exists story_share_template text not null default '',
  add column if not exists vip_magic_template text not null default '',
  add column if not exists driver_dispatch_template text not null default '',
  add column if not exists customer_segmentation jsonb not null default '{}'::jsonb,
  add column if not exists logo_url text,
  add column if not exists hero_title text not null default '',
  add column if not exists hero_subtitle text not null default '',
  add column if not exists hero_video_url text not null default '',
  add column if not exists footer_description text not null default '',
  add column if not exists floating_whatsapp_text text not null default '',
  add column if not exists testimonials_json jsonb not null default '{}'::jsonb,
  add column if not exists faq_json jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

insert into public.shop_settings (id)
values (true)
on conflict (id) do nothing;

commit;
