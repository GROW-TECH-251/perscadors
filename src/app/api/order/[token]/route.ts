import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Référence métier générée par generateOrderNumber() : HP-YYYYMMDD-####
// (src/services/orderService.ts). Même motif que checkoutValidation.ts.
const ORDER_NUMBER_PATTERN = /^HP-\d{8}-\d{4}$/;

// Colonnes lues en base. Volontairement NON sensibles : ni client_name,
// ni client_phone, ni client_area, ni idempotency_key, ni payment_*.
// Le numéro de suivi est l'unique preuve de possession exposée au public.
const ORDER_COLUMNS =
  'order_number, status, created_at, items, subtotal, delivery_fee, total, history';

interface TrackedOrderResponse {
  order_number: string;
  status: string;
  created_at: string;
  items: Array<{ name: string; price: number; quantity: number; size: string; color: string }>;
  subtotal: number;
  delivery_fee: number;
  total: number;
  history: Array<{ status: string; date: string; note?: string }>;
}

/**
 * Whitelist explicite : quoi qu'il arrive (évolution du schéma, select élargi),
 * seuls ces champs non sensibles peuvent sortir de cette route.
 */
function toTrackedOrder(row: Record<string, unknown>): TrackedOrderResponse {
  const items = Array.isArray(row.items)
    ? row.items.map((item: unknown) => {
        const i = (item ?? {}) as Record<string, unknown>;
        return {
          name: typeof i.name === 'string' ? i.name : '',
          price: typeof i.price === 'number' ? i.price : Number(i.price) || 0,
          quantity: typeof i.quantity === 'number' ? i.quantity : Number(i.quantity) || 0,
          size: typeof i.size === 'string' ? i.size : '',
          color: typeof i.color === 'string' ? i.color : '',
        };
      })
    : [];

  const history = Array.isArray(row.history)
    ? row.history.map((entry: unknown) => {
        const e = (entry ?? {}) as Record<string, unknown>;
        return {
          status: typeof e.status === 'string' ? e.status : '',
          date: typeof e.date === 'string' ? e.date : '',
          note: typeof e.note === 'string' ? e.note : undefined,
        };
      })
    : [];

  return {
    order_number: typeof row.order_number === 'string' ? row.order_number : '',
    status: typeof row.status === 'string' ? row.status : 'EN ATTENTE',
    created_at: typeof row.created_at === 'string' ? row.created_at : '',
    items,
    subtotal: Number(row.subtotal) || 0,
    delivery_fee: Number(row.delivery_fee) || 0,
    total: Number(row.total) || 0,
    history,
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  // Format invalide = introuvable (aucune fuite d'information sur le format).
  if (!token || !ORDER_NUMBER_PATTERN.test(token)) {
    return NextResponse.json(
      { error: 'Commande introuvable ou numéro de suivi invalide.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // La partie aléatoire du numéro n'est que de 4 chiffres : la limitation de
  // débit par IP est indispensable contre l'énumération.
  const rate = await enforceRateLimit(request, 'order-tracking');
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds), 'Cache-Control': 'no-store' },
      }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Le service de suivi est indisponible.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .eq('order_number', token)
    .maybeSingle();

  if (error) {
    console.warn('order_tracking_fetch_failed', { code: error.code });
    return NextResponse.json(
      { error: 'Le service de suivi est indisponible.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Commande introuvable ou numéro de suivi invalide.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(toTrackedOrder(data as Record<string, unknown>), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
