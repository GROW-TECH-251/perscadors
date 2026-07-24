alter table public.shop_settings
  add column if not exists product_share_template text not null default '',
  add column if not exists outfit_share_template text not null default '',
  add column if not exists content_share_template text not null default '',
  add column if not exists customer_relaunch_template text not null default '';
