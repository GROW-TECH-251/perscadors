export async function deleteCloudinaryVideo(publicId: string): Promise<string | null> {
  try {
    const response = await fetch('/api/media/cloudinary-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicId }) });
    if (!response.ok) return 'Impossible de supprimer la vidéo Cloudinary.';
    return null;
  } catch { return 'Connexion Cloudinary indisponible.'; }
}

export async function uploadCloudinaryVideo(file: File, folder: string): Promise<{ url: string; publicId: string; error?: string }> {
  try {
    const signatureResponse = await fetch('/api/media/cloudinary-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder })
    });
    if (!signatureResponse.ok) return { url: '', publicId: '', error: 'Préparation Cloudinary impossible.' };
    const signature = await signatureResponse.json() as { timestamp: number; signature: string; eager: string; apiKey: string; cloudName: string };
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('signature', signature.signature);
    form.append('folder', folder);
    form.append('eager', signature.eager);
    const upload = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`, { method: 'POST', body: form });
    const result = await upload.json() as { secure_url?: string; public_id?: string; eager?: Array<{ secure_url?: string }>; error?: { message?: string } };
    if (!upload.ok || !result.secure_url) return { url: '', publicId: '', error: result.error?.message || 'Transcodage vidéo impossible.' };
    return { url: result.eager?.[0]?.secure_url || result.secure_url, publicId: result.public_id || '' };
  } catch {
    return { url: '', publicId: '', error: 'Connexion Cloudinary indisponible.' };
  }
}
