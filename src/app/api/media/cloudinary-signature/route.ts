import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({
      error: 'Cloudinary n’est pas configuré dans les variables serveur locales.'
    }, { status: 503 });
  }
  const { folder } = await request.json() as { folder?: string };
  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary vidéo : H.264 + AAC dans un conteneur MP4 largement compatible.
  // `c_transcode` est invalide ici : Cloudinary attend vc_h264 pour le codec vidéo.
  const eager = 'vc_h264,ac_aac,f_mp4,q_auto';
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder: folder || 'perscadors/hero', eager }, process.env.CLOUDINARY_API_SECRET);
  return NextResponse.json({ timestamp, signature, eager, apiKey: process.env.CLOUDINARY_API_KEY, cloudName: process.env.CLOUDINARY_CLOUD_NAME });
}
