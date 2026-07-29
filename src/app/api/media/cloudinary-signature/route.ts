import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';
import { requireAdmin } from '@/lib/requireAdmin';
import { enforceRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_FOLDERS = new Set([
  'perscadors/hero',
  'perscadors/testimonials',
  'perscadors/ambience'
]);

export async function POST(request: Request) {
  const rate = await enforceRateLimit(request, 'cloudinary-signature');
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez dans quelques minutes.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds), 'Cache-Control': 'no-store' } });
  }
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: 'Service média indisponible.' }, { status: 503 });
  }

  let folder: unknown;
  try {
    ({ folder } = await request.json() as { folder?: unknown });
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const safeFolder = typeof folder === 'string' ? folder.trim() : 'perscadors/hero';
  if (!ALLOWED_FOLDERS.has(safeFolder)) {
    return NextResponse.json({ error: 'Destination média invalide.' }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const eager = 'vc_h264,ac_aac,f_mp4,q_auto';
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: safeFolder, eager },
    process.env.CLOUDINARY_API_SECRET
  );

  return NextResponse.json({
    timestamp,
    signature,
    eager,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
