import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { verifyTurnstile } from '@/lib/turnstile';
import { enforceRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
}

interface CheckoutPayload {
  turnstileToken: string;
  order_number: string;
  idempotency_key: string;
  client_name: string;
  client_phone: string;
  client_area: string;
  items: CheckoutItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}

const ORDER_NUMBER = /^HP-\d{8}-\d{4}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSafeText(value: unknown, min: number, max: number): value is string {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}

function isValidPayload(value: unknown): value is CheckoutPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<CheckoutPayload>;
  if (!isSafeText(payload.turnstileToken, 20, 2048)) return false;
  if (!isSafeText(payload.order_number, 1, 32) || !ORDER_NUMBER.test(payload.order_number)) return false;
  if (!isSafeText(payload.idempotency_key, 1, 64) || !UUID.test(payload.idempotency_key)) return false;
  if (!isSafeText(payload.client_name, 2, 120) || !isSafeText(payload.client_area, 2, 160)) return false;
  if (typeof payload.client_phone !== 'string' || payload.client_phone.length > 24) return false;
  if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 20) return false;
  if (!payload.items.every((item) => item && isSafeText(item.name, 1, 160) && isSafeText(item.size, 1, 40) && isSafeText(item.color, 1, 60) && Number.isFinite(item.price) && item.price >= 0 && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 20)) return false;
  const subtotal = payload.subtotal;
  const deliveryFee = payload.delivery_fee;
  const total = payload.total;
  if (typeof subtotal !== 'number' || typeof deliveryFee !== 'number' || typeof total !== 'number') return false;
  if (![subtotal, deliveryFee, total].every((amount) => Number.isFinite(amount) && amount >= 0)) return false;
  return total === subtotal + deliveryFee;
}

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

  if (!isValidPayload(payload)) {
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
    return NextResponse.json({ error: 'La commande ne peut pas être enregistrée pour le moment.' }, { status: 503 });
  }

  return NextResponse.json({ persisted: true }, { headers: { 'Cache-Control': 'no-store' } });
}
