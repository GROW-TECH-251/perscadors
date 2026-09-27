import 'server-only';

import { recordSecurityEvent } from '@/lib/securityAudit';

interface TurnstileResponse {
  success: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
}

// E8 : la cause reelle du refus determine le message utilisateur (cote route)
// et remonte dans les logs de securite (champ code) pour le diagnostic prod.
export type TurnstileRejectionReason = 'malformed' | 'consumed' | 'hostname' | 'action' | 'network';

export interface TurnstileVerification {
  valid: boolean;
  reason?: TurnstileRejectionReason;
}

function allowedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_ALLOWED_HOSTNAMES || 'perscadors.vercel.app,localhost')
      .split(',')
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function verifyTurnstile(token: unknown, request: Request, expectedAction: string): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || typeof token !== 'string' || token.length < 20 || token.length > 2048) {
    await recordSecurityEvent('turnstile_rejected', { route: 'turnstile', scope: expectedAction, status: 403, code: 'malformed' });
    return { valid: false, reason: 'malformed' };
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
    if (valid) return { valid: true };

    let reason: TurnstileRejectionReason;
    if (result.success !== true) {
      reason = result['error-codes']?.includes('timeout-or-duplicate') ? 'consumed' : 'malformed';
    } else if (result.action !== expectedAction) {
      reason = 'action';
    } else {
      reason = 'hostname';
    }
    await recordSecurityEvent('turnstile_rejected', {
      route: 'turnstile',
      scope: expectedAction,
      status: 403,
      code: `${reason}:${result['error-codes']?.join(',') || 'none'}`
    });
    return { valid: false, reason };
  } catch {
    await recordSecurityEvent('turnstile_rejected', { route: 'turnstile', scope: expectedAction, status: 503, code: 'network' });
    return { valid: false, reason: 'network' };
  }
}
