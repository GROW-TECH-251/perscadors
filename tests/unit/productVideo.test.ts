import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou IMP-08 — Vidéo produit :
// - migration SQL idempotente (2 colonnes, RLS inchangée) ;
// - chaîne de données complète : AdminProduct -> normalizeAdminProduct -> Product.video ;
// - galerie : vidéo = média PRINCIPAL initial, tuile ▶, retour photo par clic, swipe modulo, pas d'autoplay in-page ;
// - lightbox : slide vidéo sans zoom, autoplay coupé sous prefers-reduced-motion ;
// - JSON-LD : VideoObject uniquement si vidéo présente ;
// - admin : upload validé (type/30 Mo) + suppression Cloudinary sur les 2 formulaires ;
// - zéro régression : produits sans vidéo = rendu identique, panier/WhatsApp intacts.
describe('Unit — IMP-08 Vidéo produit', () => {
  it('la migration SQL existe, est idempotente et ajoute exactement les 2 colonnes', async () => {
    const sql = await readFile('supabase/migrations/add_product_video.sql', 'utf-8');
    expect(sql).toContain('add column if not exists video_url text null');
    expect(sql).toContain('add column if not exists video_public_id text null');
    expect(sql).not.toMatch(/drop\s+policy|create policy/i);
  });

  it('les types exposent la vidéo : Product.video optionnel, AdminProduct/ProductFormData transport', async () => {
    const pub = await readFile('src/types/index.ts', 'utf-8');
    const adm = await readFile('src/admin/types.ts', 'utf-8');
    expect(pub).toContain('video?: string;');
    expect(pub.match(/video\?: string;/g)?.length).toBe(1);
    expect(adm).toContain('video_url?: string | null;');
    expect(adm).toContain('video_public_id?: string | null;');
  });

  it('normalizeAdminProduct mappe la vidéo et expose toutes les images de la base', async () => {
    const svc = await readFile('src/services/publicCatalogService.ts', 'utf-8');
    expect(svc).toContain('video: product.video_url?.trim() || undefined');
    expect(svc).toContain('images: [baseImage, ...(product.images || []).filter((url) => url && url !== baseImage)]');
    expect(svc).not.toContain('images: [baseImage],');
  });

  it('la fiche produit : vidéo média PRINCIPAL initial, tuile ▶, retour photo par clic, pas d’autoplay in-page, swipe modulo', async () => {
    const page = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(page).toContain('const hasVideo = Boolean(product.video);');
    expect(page).toContain('const videoIndex = product.images.length;');
    expect(page).toContain('const mediaCount = product.images.length + (hasVideo ? 1 : 0);');
    // Restauration catalogue — la vidéo est le premier média affiché quand elle existe.
    expect(page).toContain('const [videoActive, setVideoActive] = useState(hasVideo);');
    // Cliquer une miniature photo désactive la vidéo (la photo devient le média principal).
    expect(page).toContain('onClick={() => { setVideoActive(false); setSelectedImage(image); }}');
    expect(page).toContain('% mediaCount');
    expect(page).toContain('setVideoActive(true)');
    expect(page).toContain('Lire la vidéo de');
    expect(page).toContain('poster={product.images[0]}');
    expect(page).toContain('preload="metadata"');
    expect(page).toContain('playsInline');
    expect(page.match(/<video[\s\S]*?autoPlay/)).toBeNull();
    expect(page).toContain('video={hasVideo ? product.video : undefined}');
  });

  it('la lightbox : slide vidéo, zoom désactivé dessus, autoplay coupé sous reduced-motion', async () => {
    const lb = await readFile('src/components/public/ProductLightbox.tsx', 'utf-8');
    expect(lb).toContain('video?: string;');
    expect(lb).toContain('const total = images.length + (video ? 1 : 0);');
    expect(lb).toContain('{index + 1} / {total}');
    expect(lb).toContain('if (isVideoSlide) return;');
    expect(lb).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
    expect(lb).toContain('autoPlay={autoPlayVideo}');
    expect(lb).toContain('aria-label="Voir la vidéo"');
  });

  it('JSON-LD : VideoObject présent uniquement si le produit a une vidéo', async () => {
    const page = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(page).toContain('...(product.video');
    expect(page).toContain('"@type": "VideoObject"');
    expect(page).toContain('contentUrl: product.video');
    expect(page).toContain('thumbnailUrl: product.images[0]');
  });

  it('admin : les 2 formulaires gèrent la vidéo (validation, Cloudinary, confirmation)', async () => {
    for (const path of ['src/app/admin/produits/nouveau/page.tsx', 'src/app/admin/produits/[id]/page.tsx']) {
      const form = await readFile(path, 'utf-8');
      expect(form).toContain('uploadProductVideo(');
      expect(form).toContain('handleVideoUpload');
      expect(form).toContain('handleConfirmRemoveVideo');
      expect(form).toContain('30 * 1024 * 1024');
      expect(form).toContain('video/mp4,video/webm,video/quicktime');
      expect(form).toContain('Supprimer la vidéo');
      expect(form).toContain('video_public_id: null');
    }
    const edit = await readFile('src/app/admin/produits/[id]/page.tsx', 'utf-8');
    expect(edit).toContain('video_url: data.video_url || null');
    expect(edit).toContain('video_public_id: data.video_public_id || null');
  });

  it('mediaService : upload vidéo produit via Cloudinary, suppression best-effort ; panier/WhatsApp intacts', async () => {
    const media = await readFile('src/services/mediaService.ts', 'utf-8');
    expect(media).toContain('export async function uploadProductVideo(');
    expect(media).toContain('`perscadors/products/${safeProductId}`');
    expect(media).toContain('export async function deleteProductVideo(');
    expect(media).toContain('await deleteCloudinaryVideo(publicId);');
    const page = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(page).toContain('handleAddToCart');
    expect(page).toContain('handleDealWhatsApp');
    expect(page).toContain('openWhatsApp(message, settings.whatsapp_phone)');
  });
});
