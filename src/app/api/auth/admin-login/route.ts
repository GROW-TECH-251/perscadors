import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { verifyTurnstile } from '@/lib/turnstile';
import { recordSecurityEvent } from '@/lib/securityAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LoginPayload {
  email?: unknown;
  password?: unknown;
  captchaToken?: unknown;
}

function jsonWithCookies(
  body: Record<string, unknown>,
  status: number,
  updates: Array<{ name: string; value: string; options: CookieOptions }>
): NextResponse {
  const response = NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
  updates.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export async function POST(request: Request) {
  let payload: LoginPayload;
  try {
    payload = await request.json() as LoginPayload;
  } catch {
    return NextResponse.json({ ok: false, message: 'Connexion indisponible. Réessayez.' }, { status: 400 });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const captchaToken = typeof payload.captchaToken === 'string' ? payload.captchaToken : '';
  if (!email || !password || !captchaToken || email.length > 254 || password.length > 256) {
    return NextResponse.json({ ok: false, message: 'Connexion indisponible. Réessayez.' }, { status: 400 });
  }

  const rate = await enforceRateLimit(request, 'admin-login', email);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds), 'Cache-Control': 'no-store' } }
    );
  }

  if (!await verifyTurnstile(captchaToken, request, 'admin_login')) {
    return NextResponse.json({ ok: false, message: 'La vérification anti-bot a expiré. Réessayez.' }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, message: 'Connexion indisponible. Réessayez.' }, { status: 503 });
  }

  const cookieUpdates: Array<{ name: string; value: string; options: CookieOptions }> = [];
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => [],
      setAll: (cookies: Array<{ name: string; value: string; options: CookieOptions }>) => cookieUpdates.push(...cookies)
    }
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken }
  });
  if (error || !data.user) {
    await recordSecurityEvent('admin_login_failed', {
      route: '/api/auth/admin-login',
      status: 401,
      actor: 'anonymous',
      code: error?.code || 'auth_failed'
    });
    return jsonWithCookies({ ok: false, message: 'Identifiant ou mot de passe incorrect.' }, 401, cookieUpdates);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'admin') {
    await supabase.auth.signOut();
    await recordSecurityEvent('admin_login_denied', { route: '/api/auth/admin-login', status: 403, actor: 'authenticated' });
    return jsonWithCookies({ ok: false, message: 'Ce compte ne possède pas les droits d’administration.' }, 403, cookieUpdates);
  }

  await recordSecurityEvent('admin_login_succeeded', { route: '/api/auth/admin-login', status: 200, actor: 'admin' });
  return jsonWithCookies({ ok: true }, 200, cookieUpdates);
}
