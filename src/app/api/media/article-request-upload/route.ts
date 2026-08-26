import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { recordSecurityEvent } from '@/lib/securityAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export async function POST(request: Request) {
  const rate = await enforceRateLimit(request, 'checkout-api');
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Trop de demandes. Réessayez dans quelques minutes.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds), 'Cache-Control': 'no-store' } }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: 'Service de médias indisponible.' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Formulaire invalide.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Seules les images sont autorisées.' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop volumineuse (max 5MB).' }, { status: 400 });
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const safeName = sanitizeFileName(file.name);
  const path = `requests/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from('article-requests').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    console.warn('article_request_upload_failed', { code: error.message });
    await recordSecurityEvent('checkout_insert_failed', {
      route: '/api/media/article-request-upload',
      status: 503,
      code: 'upload_failed',
    });
    return NextResponse.json({ error: 'Impossible d\'uploader l\'image.' }, { status: 503 });
  }

  const { data: urlData } = supabase.storage.from('article-requests').getPublicUrl(path);

  return NextResponse.json(
    { url: urlData.publicUrl, path },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
