import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/requireAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLOUDINARY_PUBLIC_ID = /^perscadors\/(hero|testimonials|ambience)\/[A-Za-z0-9_-]{1,160}$/;

export async function POST(request: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
  }

  if (!process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: 'Service média indisponible.' }, { status: 503 });
  }

  let publicId: unknown;
  try {
    ({ publicId } = await request.json() as { publicId?: unknown });
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  if (typeof publicId !== 'string' || !CLOUDINARY_PUBLIC_ID.test(publicId)) {
    return NextResponse.json({ error: 'Identifiant média invalide.' }, { status: 400 });
  }

  const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  if (result.result !== 'ok' && result.result !== 'not found') {
    return NextResponse.json({ error: 'Suppression média impossible.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
