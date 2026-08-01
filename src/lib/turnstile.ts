import 'server-only';

import { recordSecurityEvent } from '@/lib/securityAudit';

interface TurnstileResponse {
  success: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
}

function allowedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_ALLOWED_HOSTNAMES || 'perscadors.vercel.app,localhost')
      .split(',')
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function verifyTurnstile(token: unknown, request: Request, expectedAction: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || typeof token !== 'string' || token.length < 20 || token.length > 2048) {
    await recordSecurityEvent('turnstile_rejected', { route: 'turnstile', scope: expectedAction, status: 403 });
    return false;
  }

  const form = new URLSearchParams({ secret, response: token });
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwardedFor) form.set('remoteip', forwardedFor);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      cache: 'no-store'
    });
    const result = await response.json() as TurnstileResponse;
    const valid = result.success === true
      && result.action === expectedAction
      && Boolean(result.hostname && allowedHostnames().has(result.hostname.toLowerCase()));
    if (!valid) await recordSecurityEvent('turnstile_rejected', { route: 'turnstile', scope: expectedAction, status: 403 });
    return valid;
  } catch {
    await recordSecurityEvent('turnstile_rejected', { route: 'turnstile', scope: expectedAction, status: 503 });
    return false;
  }
}
