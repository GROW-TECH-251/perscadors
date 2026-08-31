export async function shareMediaToWhatsAppStatus(url: string, title = 'Perscadors'): Promise<{ shared: boolean; message?: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('media_fetch_failed');
    const blob = await response.blob();
    const extension = blob.type.startsWith('video/') ? 'mp4' : blob.type.includes('png') ? 'png' : 'jpg';
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
