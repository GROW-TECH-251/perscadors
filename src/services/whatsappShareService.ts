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
