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
      setAll: (cookies: Array<{ name: string; value: string; options: CookieOptions }>) => { cookieUpdates.push(...cookies); }
    }
  });

  // FIX SEC-AUTH-001 : Suppression double vérification Turnstile
  // Le token Turnstile est à usage unique. verifyTurnstile() ci-dessus le consomme
  // via Cloudflare siteverify. Si on le repasse à Supabase (options.captchaToken),
  // Supabase retente siteverify → Cloudflare répond "timeout-or-duplicate"
  // → 400 captcha_failed (vu dans supabase-auth-logs : "captcha protection: request disallowed (timeout-or-duplicate)")
  // Solution : garder notre vérif custom (hostname + action) et désactiver CAPTCHA dans Supabase Dashboard
  // Auth → Configuration → CAPTCHA → Disable. Ainsi signIn sans captchaToken.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    // Audit latence : l'événement de sécurité est journalisé sans bloquer la
    // réponse (fire-and-forget) — 1 aller-retour séquentiel de moins au login.
    void recordSecurityEvent('admin_login_failed', {
      route: '/api/auth/admin-login',
      status: 401,
      actor: 'anonymous',
      code: error?.code || 'auth_failed'
    }).catch(() => undefined);
    return jsonWithCookies({ ok: false, message: 'Identifiant ou mot de passe incorrect.' }, 401, cookieUpdates);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'admin') {
    await supabase.auth.signOut();
    void recordSecurityEvent('admin_login_denied', { route: '/api/auth/admin-login', status: 403, actor: 'authenticated' }).catch(() => undefined);
    return jsonWithCookies({ ok: false, message: 'Ce compte ne possède pas les droits d’administration.' }, 403, cookieUpdates);
  }

  void recordSecurityEvent('admin_login_succeeded', { route: '/api/auth/admin-login', status: 200, actor: 'admin' }).catch(() => undefined);
  return jsonWithCookies({ ok: true }, 200, cookieUpdates);
}
