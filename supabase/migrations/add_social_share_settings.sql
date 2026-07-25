alter table public.shop_settings
  add column if not exists social_title text,
  add column if not exists social_description text,
  add column if not exists social_image_url text;
