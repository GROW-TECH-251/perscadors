import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { verifyTurnstile } from '@/lib/turnstile';
import { enforceRateLimit } from '@/lib/rateLimit';
import { recordSecurityEvent } from '@/lib/securityAudit';
import { isValidCheckoutPayload } from '@/lib/checkoutValidation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';




export async function POST(request: Request) {
  const rate = await enforceRateLimit(request, 'checkout-api');
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez dans quelques minutes.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds), 'Cache-Control': 'no-store' } });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 });
  }

  if (!isValidCheckoutPayload(payload)) {
    return NextResponse.json({ error: 'Les informations de commande sont invalides.' }, { status: 400 });
  }

  const orderRate = await enforceRateLimit(request, 'checkout-order');
  if (!orderRate.allowed) {
    return NextResponse.json({ error: 'Trop de commandes sont en cours. Réessayez dans quelques minutes.' }, { status: 429, headers: { 'Retry-After': String(orderRate.retryAfterSeconds), 'Cache-Control': 'no-store' } });
  }

  if (!await verifyTurnstile(payload.turnstileToken, request, 'checkout')) {
    return NextResponse.json({ error: 'La vérification anti-bot a expiré. Réessayez.' }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: 'Le service de commande est indisponible.' }, { status: 503 });
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const now = new Date().toISOString();
  const order = {
    order_number: payload.order_number,
    idempotency_key: payload.idempotency_key,
    client_name: payload.client_name.trim(),
    client_phone: payload.client_phone.trim(),
    client_area: payload.client_area.trim(),
    items: payload.items,
    subtotal: payload.subtotal,
    delivery_fee: payload.delivery_fee,
    total: payload.total
  };
  const { error } = await supabase.from('orders').insert({
    ...order,
    status: 'EN ATTENTE',
    sync_status: 'synced',
    history: [{ status: 'EN ATTENTE', date: now, note: 'Commande créée depuis le panier' }],
    created_at: now,
    updated_at: now
  });

  if (error?.code === '23505') {
    return NextResponse.json({ persisted: true, duplicate: true }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (error) {
    console.warn('checkout_insert_failed', { code: error.code });
    await recordSecurityEvent('checkout_insert_failed', { route: '/api/checkout', status: 503, code: error.code || 'unknown' });
    return NextResponse.json({ error: 'La commande ne peut pas être enregistrée pour le moment.' }, { status: 503 });
  }

  await recordSecurityEvent('checkout_created', { route: '/api/checkout', status: 200 });
  return NextResponse.json({ persisted: true }, { headers: { 'Cache-Control': 'no-store' } });
}
