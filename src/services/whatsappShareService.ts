/**
 * E6 (étude natif gratuit) — Extension du fichier partagé dérivée du type
 * MIME réel (avec repli sur l'extension de l'URL, puis « jpg »). Avant : tout
 * média non-png était nommé .jpg — un webp/jsong contenu .jpg est rejeté par
 * certains lecteurs stricts (et WhatsApp peut refuser la pièce).
 */
const MEDIA_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export function mediaShareExtension(blobType: string, url: string): string {
  const fromType = MEDIA_EXTENSIONS[blobType.split(';')[0].trim().toLowerCase()];
  if (fromType) return fromType;
  const fromUrl = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (fromUrl && /^[a-z0-9]{2,5}$/.test(fromUrl) && fromUrl !== url.split('?')[0].toLowerCase()) return fromUrl;
  return 'jpg';
}
export async function shareMediaToWhatsAppStatus(url: string, title = 'Perscadors'): Promise<{ shared: boolean; message?: string }> {
  try {
    // E6 — timeout : un média lent/injoignable ne doit plus laisser le bouton
    // sans retour indéfiniment (l'utilisateur récupère le repli onglet).
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 12_000);
    let response: Response;
    try {
      response = await fetch(url, { signal: abort.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) throw new Error('media_fetch_failed');
    const blob = await response.blob();
    const extension = mediaShareExtension(blob.type, url);
    const file = new File([blob], `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${extension}`, { type: blob.type });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return { shared: true };
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    return { shared: false, message: 'Votre navigateur ne permet pas le partage direct. Le média a été ouvert : partagez-le depuis WhatsApp.' };
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    return { shared: false, message: 'Le partage direct est indisponible. Le média a été ouvert dans un nouvel onglet.' };
  }
}

/**
 * PERF-04 — Partage d'un FICHIER réel + texte via la feuille système
 * (navigator.share). C'est le seul moyen navigateur de joindre la photo
 * comme média WhatsApp : wa.me/Click-to-Chat ne transmet que du texte.
 * Gardes strictes : navigator.share + navigator.canShare({files}) doivent
 * exister — aucune fausse promesse sinon (le appelant retombe sur son flux
 * historique upload + lien).
 */
export async function shareFileWithText(
  file: File,
  text: string
): Promise<{ shared: boolean; reason?: 'unsupported' | 'failed' | 'aborted' }> {
  try {
    if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare?.({ files: [file] })) {
      return { shared: false, reason: 'unsupported' };
    }
    await navigator.share({ files: [file], text });
    return { shared: true };
  } catch (error) {
    if ((error as DOMException)?.name === 'AbortError') {
      return { shared: false, reason: 'aborted' };
    }
    return { shared: false, reason: 'failed' };
  }
}
