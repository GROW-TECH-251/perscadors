-- Perscadors — Fix assets 404 : migration /images/ → /assets/ + renommage dossiers
-- Contexte : commit 7219eb1 (Landron) a migré public/images/ → public/assets/ avec nouvelle arborescence
--   ARRIEREPLAN → backgrounds
--   LOGOSITE → brand
--   OUTFITCOLLECTION → collections/outfits
--   ARTICLES → collections/articles
--   Temoignages / Témoignagesetavisclients → testimonials
-- Mais site_assets.url et shop_settings.* contenaient encore /images/... → 404 dans Vercel Logs
--   GET /images/ARRIEREPLAN/7679830-uhd_4096_2160_25fps.mp4 404
--   GET /images/OUTFITCOLLECTION/outfit23.jpeg 404
-- Cette migration corrige les URLs en base sans toucher au code applicatif (qui utilise déjà /assets/)
-- Elle est idempotente et safe (REPLACE seulement si LIKE)

begin;

-- 1. site_assets : migration /images/ → /assets/
update public.site_assets
set url = replace(url, '/images/', '/assets/')
where url like '/images/%';

-- 2. site_assets : renommage dossiers historiques → nouvelle arborescence public/assets/
update public.site_assets
set url = replace(url, 'ARRIEREPLAN', 'backgrounds')
where url ilike '%ARRIEREPLAN%';

update public.site_assets
set url = replace(url, 'LOGOSITE', 'brand')
where url ilike '%LOGOSITE%';

update public.site_assets
set url = replace(url, 'OUTFITCOLLECTION', 'collections/outfits')
where url ilike '%OUTFITCOLLECTION%';

update public.site_assets
set url = replace(url, 'ARTICLES', 'collections/articles')
where url ilike '%ARTICLES%';

update public.site_assets
set url = replace(url, 'Temoignages', 'testimonials')
where url ilike '%Temoignages%';

update public.site_assets
set url = replace(url, 'Témoignagesetavisclients', 'testimonials')
where url ilike '%Témoignagesetavisclients%';

-- 3. shop_settings : même migration pour hero, logo, social, etc
update public.shop_settings
set hero_video_url = replace(hero_video_url, '/images/', '/assets/')
where hero_video_url like '/images/%';

update public.shop_settings
set hero_video_url = replace(hero_video_url, 'ARRIEREPLAN', 'backgrounds')
where hero_video_url ilike '%ARRIEREPLAN%';

update public.shop_settings
set logo_url = replace(logo_url, '/images/', '/assets/')
where logo_url like '/images/%';

update public.shop_settings
set logo_url = replace(logo_url, 'LOGOSITE', 'brand')
where logo_url ilike '%LOGOSITE%';

update public.shop_settings
set social_image_url = replace(social_image_url, '/images/', '/assets/')
where social_image_url like '/images/%';

update public.shop_settings
set social_image_url = replace(social_image_url, 'ARTICLES', 'collections/articles')
where social_image_url ilike '%ARTICLES%';

-- 4. Pour les installations qui ont encore des assets avec ancien chemin complet https://perscadors.vercel.app/images/
update public.site_assets
set url = replace(url, 'perscadors.vercel.app/images/', 'perscadors.vercel.app/assets/')
where url like '%perscadors.vercel.app/images/%';

update public.shop_settings
set hero_video_url = replace(hero_video_url, 'perscadors.vercel.app/images/', 'perscadors.vercel.app/assets/')
where hero_video_url like '%perscadors.vercel.app/images/%';

update public.shop_settings
set logo_url = replace(logo_url, 'perscadors.vercel.app/images/', 'perscadors.vercel.app/assets/')
where logo_url like '%perscadors.vercel.app/images/%';

update public.shop_settings
set social_image_url = replace(social_image_url, 'perscadors.vercel.app/images/', 'perscadors.vercel.app/assets/')
where social_image_url like '%perscadors.vercel.app/images/%';

-- 5. Nettoyage cache local : les anciennes URLs avec /images/ ne doivent plus être servies
-- Le code applicatif utilise déjà /assets/ (vérifié grep -R /assets/ 40+ refs)
-- Cette migration ne supprime rien, elle corrige seulement

commit;

-- Vérification post-migration (à exécuter manuellement) :
-- SELECT id, url FROM site_assets WHERE url LIKE '/images/%'; -- doit être 0
-- SELECT hero_video_url, logo_url, social_image_url FROM shop_settings WHERE hero_video_url LIKE '/images/%' OR logo_url LIKE '/images/%' OR social_image_url LIKE '/images/%'; -- doit être 0
-- SELECT url FROM site_assets WHERE url LIKE '%ARRIEREPLAN%' OR url LIKE '%LOGOSITE%' OR url LIKE '%OUTFITCOLLECTION%'; -- doit être 0 (anciens noms)
