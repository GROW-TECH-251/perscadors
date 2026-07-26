-- Retire le reliquat historique de livraison gratuite.
-- La colonne peut exister sur des installations plus anciennes via
-- align_shop_settings_schema.sql ; IF EXISTS rend la migration sûre partout.
alter table public.shop_settings
  drop column if exists delivery_free_threshold;
