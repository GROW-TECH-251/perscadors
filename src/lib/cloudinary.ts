import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export { cloudinary };


// E2 — Garde de signature : dossiers d'upload autorisés. Les trois sections
// « contenu » restent en égalité stricte ; les vidéos PRODUIT vivent sous
// « perscadors/products/<id> » (uploadProductVideo). L'allowlist stricte
// historique les refusait (400 « Destination média invalide »), rendant
// impossible tout ajout de vidéo produit. Le segment final est contraint
// (id numérique, « draft », slug) : aucun traversal (« .. », slash) ne passe.
const ALLOWED_SECTION_FOLDERS = new Set([
  'perscadors/hero',
  'perscadors/testimonials',
  'perscadors/ambience'
]);
const PRODUCT_FOLDER_PATTERN = /^perscadors\/products\/[A-Za-z0-9_-]+$/;

export function isAllowedMediaFolder(folder: string): boolean {
  const value = folder.trim();
  if (!value) return false;
  return ALLOWED_SECTION_FOLDERS.has(value) || PRODUCT_FOLDER_PATTERN.test(value);
}
