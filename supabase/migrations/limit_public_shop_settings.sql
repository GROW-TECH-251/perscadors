-- Sépare les réglages nécessaires à la vitrine des réglages internes.
-- Les utilisateurs anonymes ne peuvent plus lire directement les modèles de
-- messages, le numéro du livreur ou les seuils de segmentation.

begin;

drop policy if exists shop_settings_public_read on public.shop_settings;
revoke select on public.shop_settings from anon;

create or replace view public.public_shop_settings
with (security_invoker = false)
as
select
  shop_name,
  whatsapp_phone,
  currency,
  country,
  delivery_zones,
  delivery_time,
  checkout_order_template,
  logo_url,
  hero_title,
  hero_subtitle,
  hero_video_url,
  footer_description,
  floating_whatsapp_text,
  social_title,
  social_description,
  social_image_url,
  testimonials_json,
  faq_json,
  updated_at
from public.shop_settings;

grant select on public.public_shop_settings to anon, authenticated;

commit;
