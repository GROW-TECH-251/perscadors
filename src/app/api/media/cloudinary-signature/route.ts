import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: 'Cloudinary n’est pas configuré côté serveur.' }, { status: 503 });
  }
  const { folder } = await request.json() as { folder?: string };
  const timestamp = Math.floor(Date.now() / 1000);
  const eager = 'c_transcode,f_mp4,q_auto';
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder: folder || 'perscadors/hero', eager }, process.env.CLOUDINARY_API_SECRET);
  return NextResponse.json({ timestamp, signature, eager, apiKey: process.env.CLOUDINARY_API_KEY, cloudName: process.env.CLOUDINARY_CLOUD_NAME });
}
