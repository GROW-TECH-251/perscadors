-- ============================================
-- PERF-04 — Audit encodage WhatsApp (à exécuter dans le SQL Editor Supabase)
-- ============================================
-- Contexte : des caractères « � » (U+FFFD, caractère de remplacement) ont été
-- observés dans certains messages. Le code client a été audité propre
-- (encodeURIComponent partout, sources UTF-8 sans corruption, aucun mojibake).
-- Deux causes restaient possibles :
--   (A) des lignes de la base contenant déjà U+FFFD (insertion via copier-
--       coller / SQL Editor avec mauvais encodage) ;
--   (B) la troncature d'URL longues entre deux moitiés d'emoji — corrigée
--       côté application (normalisation NFC + coupe sûre, PERF-04).
-- Ce script détecte (A). Exécuter la partie DÉTECTION d'abord ; ne lancer la
-- partie CORRECTION qu'après avoir revu les lignes concernées.

-- ────────────────────────────────────────────
-- 1) DÉTECTION — quels textes contiennent U+FFFD ?
-- ────────────────────────────────────────────
select 'shop_settings.checkout_order_template' as champ,
       length(checkout_order_template) as longueur,
       (checkout_order_template like '%' || chr(65533) || '%') as contient_replacement
from public.shop_settings
order by updated_at desc
limit 5;

-- Templates de partage WhatsApp (table présente selon migrations) :
select name,
       length(content) as longueur,
       (content like '%' || chr(65533) || '%') as contient_replacement
from public.whatsapp_share_templates;

-- Réglages héros / textes publics les plus couramment injectés dans les messages :
select hero_title,
       (hero_title like '%' || chr(65533) || '%') as titre_corrompu,
       hero_subtitle,
       (hero_subtitle like '%' || chr(65533) || '%') as sous_titre_corrompu
from public.shop_settings
order by updated_at desc
limit 5;

-- Balayage large : produits (noms/descriptions passent dans les messages de commande) :
select id, name,
       (name like '%' || chr(65533) || '%') as nom_corrompu,
       (coalesce(description, '') like '%' || chr(65533) || '%') as description_corrompue
from public.products
where (name like '%' || chr(65533) || '%')
   or (coalesce(description, '') like '%' || chr(65533) || '%');

-- ────────────────────────────────────────────
-- 2) CORRECTION (optionnelle — décommenter APRÈS revue)
-- ────────────────────────────────────────────
-- Remplace les séquences « Ã© »-like (double encodage) et U+FFFD par les
-- caractères français corrects dans le template de commande.
-- update public.shop_settings
--    set checkout_order_template = replace(checkout_order_template, chr(65533), 'e')
--  where checkout_order_template like '%' || chr(65533) || '%';
--
-- Pour une réparation propre, il est préférable de RECOLLER le texte corrigé
-- directement depuis l'admin (Réglages) plutôt que d'automatiser un remplacement
-- aveugle : le caractère remplacé peut être é, è, ê, à, ç ou un emoji.
