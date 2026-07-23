import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  if (!process.env.CLOUDINARY_API_SECRET) return NextResponse.json({ error: 'Cloudinary non configuré.' }, { status: 503 });
  const { publicId } = await request.json() as { publicId?: string };
  if (!publicId) return NextResponse.json({ error: 'Identifiant vidéo manquant.' }, { status: 400 });
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  if (result.result !== 'ok' && result.result !== 'not found') return NextResponse.json({ error: 'Suppression Cloudinary impossible.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
