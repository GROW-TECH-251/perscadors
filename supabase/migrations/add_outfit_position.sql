-- Phase finale 09/2026 (E1) — HP inspection : ordre d'affichage des outfits
-- piloté depuis l'administration (champ « Ordre d'affichage », 1 = premier).
-- À exécuter dans le SQL Editor Supabase (par l'équipe). Idempotent.

ALTER TABLE outfits ADD COLUMN IF NOT EXISTS position int;

-- Backfill : figer l'ordre public ACTUEL (created_at DESC) comme point de
-- départ, puis l'admin réordonne librement depuis /admin/hpb.
WITH ordre_actuel AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
  FROM outfits
)
UPDATE outfits SET position = ordre_actuel.rn
FROM ordre_actuel
WHERE outfits.id = ordre_actuel.id AND outfits.position IS NULL;

-- Lecture de la page publique (/looks) : visible + position.
CREATE INDEX IF NOT EXISTS outfits_visible_position_idx
  ON outfits (visible, position ASC NULLS LAST);
