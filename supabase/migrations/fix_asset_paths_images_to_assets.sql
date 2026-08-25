-- Perscadors — Fix assets 404 : migration /images/ → /assets/ + renommage dossiers
-- Contexte : commit 7219eb1 (Landron) a migré public/images/ → public/assets/ avec nouvelle arborescence
--   ARRIEREPLAN → backgrounds
--   LOGOSITE → brand
--   OUTFITCOLLECTION → collections/outfits
--   ARTICLES → collections/articles
--   Temoignages / Témoignagesetavisclients → testimonials
-- Mais site_assets.url, shop_settings.*, outfits.image_url, products.* contenaient encore /images/... → 404 dans Vercel Logs
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

-- 5. outfits : image_url contient encore /images/OUTFITCOLLECTION/ → 404 HP Looks
update public.outfits
set image_url = replace(image_url, '/images/', '/assets/')
where image_url like '/images/%';

update public.outfits
set image_url = replace(image_url, 'OUTFITCOLLECTION', 'collections/outfits')
where image_url ilike '%OUTFITCOLLECTION%';

update public.outfits
set image_url = replace(image_url, 'LOGOSITE', 'brand')
where image_url ilike '%LOGOSITE%';

update public.outfits
set image_url = replace(image_url, 'perscadors.vercel.app/images/', 'perscadors.vercel.app/assets/')
where image_url like '%perscadors.vercel.app/images/%';

-- 6. products : image_url (text) peut contenir anciens chemins
update public.products
set image_url = replace(image_url, '/images/', '/assets/')
where image_url like '/images/%';

update public.products
set image_url = replace(image_url, 'ARTICLES', 'collections/articles')
where image_url ilike '%ARTICLES%';

update public.products
set image_url = replace(image_url, 'LOGOSITE', 'brand')
where image_url ilike '%LOGOSITE%';

update public.products
set image_url = replace(image_url, 'perscadors.vercel.app/images/', 'perscadors.vercel.app/assets/')
where image_url like '%perscadors.vercel.app/images/%';

-- 7. products.images est de type text[] (pas jsonb) → il faut utiliser unnest + array_agg
-- Fix pour text[] : remplace /images/ → /assets/ dans chaque élément du tableau
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='products' and column_name='images' and data_type='ARRAY'
  ) then
    -- Migration pour text[] : on reconstruit le tableau avec REPLACE
    update public.products
    set images = (
      select array_agg(replace(img, '/images/', '/assets/'))
      from unnest(images) as img
    )
    where exists (
      select 1 from unnest(images) as img where img like '%/images/%'
    );

    -- Renommage dossiers dans text[]
    update public.products
    set images = (
      select array_agg(replace(img, 'ARTICLES', 'collections/articles'))
      from unnest(images) as img
    )
    where exists (
      select 1 from unnest(images) as img where img ilike '%ARTICLES%'
    );

    update public.products
    set images = (
      select array_agg(replace(img, 'OUTFITCOLLECTION', 'collections/outfits'))
      from unnest(images) as img
    )
    where exists (
      select 1 from unnest(images) as img where img ilike '%OUTFITCOLLECTION%'
    );

    update public.products
    set images = (
      select array_agg(replace(img, 'LOGOSITE', 'brand'))
      from unnest(images) as img
    )
    where exists (
      select 1 from unnest(images) as img where img ilike '%LOGOSITE%'
    );

    update public.products
    set images = (
      select array_agg(replace(img, 'perscadors.vercel.app/images/', 'perscadors.vercel.app/assets/'))
      from unnest(images) as img
    )
    where exists (
      select 1 from unnest(images) as img where img like '%perscadors.vercel.app/images/%'
    );
  elsif exists (
    select 1 from information_schema.columns 
    where table_schema='public' and table_name='products' and column_name='images'
  ) then
    -- Fallback si images est jsonb ou text : tentative générique
    update public.products
    set images = replace(images::text, '/images/', '/assets/')::text::jsonb
    where images::text like '%/images/%';
  end if;
end $$;

-- 8. categories : image_url
update public.categories
set image_url = replace(image_url, '/images/', '/assets/')
where image_url like '/images/%';

update public.categories
set image_url = replace(image_url, 'ARTICLES', 'collections/articles')
where image_url ilike '%ARTICLES%';

update public.categories
set image_url = replace(image_url, 'perscadors.vercel.app/images/', 'perscadors.vercel.app/assets/')
where image_url like '%perscadors.vercel.app/images/%';

-- 9. content_posts : image_url
update public.content_posts
set image_url = replace(image_url, '/images/', '/assets/')
where image_url like '/images/%';

update public.content_posts
set image_url = replace(image_url, 'perscadors.vercel.app/images/', 'perscadors.vercel.app/assets/')
where image_url like '%perscadors.vercel.app/images/%';

-- 10. Nettoyage : anciennes URLs ne doivent plus être servies
-- Le code applicatif utilise déjà /assets/ (40+ refs)

commit;

-- Vérification post-migration (à exécuter manuellement) :
-- SELECT id, url FROM site_assets WHERE url LIKE '/images/%'; -- doit être 0
-- SELECT hero_video_url, logo_url, social_image_url FROM shop_settings WHERE hero_video_url LIKE '/images/%' OR logo_url LIKE '/images/%' OR social_image_url LIKE '/images/%'; -- doit être 0
-- SELECT url FROM site_assets WHERE url ILIKE '%ARRIEREPLAN%' OR url ILIKE '%LOGOSITE%' OR url ILIKE '%OUTFITCOLLECTION%'; -- doit être 0
-- SELECT id, image_url FROM outfits WHERE image_url LIKE '/images/%'; -- doit être 0
-- SELECT id, image_url FROM products WHERE image_url LIKE '/images/%'; -- doit être 0
-- SELECT id, images FROM products WHERE EXISTS (SELECT 1 FROM unnest(images) AS img WHERE img LIKE '%/images/%'); -- doit être 0
