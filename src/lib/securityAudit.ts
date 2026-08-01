import 'server-only';

import { Redis } from '@upstash/redis';

type SecuritySeverity = 'info' | 'warning' | 'critical';

export type SecurityEvent =
  | 'rate_limit_rejected'
  | 'rate_limit_unavailable'
  | 'turnstile_rejected'
  | 'cloudinary_access_denied'
  | 'cloudinary_delete_completed'
  | 'checkout_created'
  | 'checkout_insert_failed'
  | 'admin_login_failed'
  | 'admin_login_denied'
  | 'admin_login_succeeded';

interface SecurityEventDetails {
  route?: string;
  scope?: string;
  actor?: 'anonymous' | 'authenticated' | 'admin';
  status?: number;
  code?: string;
}

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function severityFor(event: SecurityEvent): SecuritySeverity {
  if (event === 'checkout_insert_failed') return 'critical';
  if (event === 'cloudinary_delete_completed' || event === 'checkout_created' || event === 'admin_login_succeeded') return 'info';
  return 'warning';
}

function shouldAlert(event: SecurityEvent): boolean {
  return !['checkout_created', 'admin_login_succeeded'].includes(event);
}

async function sendDiscordAlert(payload: Record<string, unknown>, event: SecurityEvent): Promise<void> {
  const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl || !shouldAlert(event)) return;

  const client = getRedis();
  if (!client) return;

  try {
    // Anti-bruit : une alerte identique au plus toutes les cinq minutes.
    const cooldown = await client.set(`perscadors:security-alert:${event}`, '1', { nx: true, ex: 300 });
    if (cooldown !== 'OK') return;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Perscadors Security',
        embeds: [{
          title: `Alerte sécurité : ${event}`,
          color: severityFor(event) === 'critical' ? 0xDC2626 : 0xD97706,
          fields: Object.entries(payload)
            .filter(([key]) => !['timestamp', 'event'].includes(key))
            .map(([name, value]) => ({ name, value: String(value), inline: true })),
          timestamp: payload.timestamp
        }]
      }),
      cache: 'no-store'
    });
  } catch {
    // Le canal d'alerte ne doit jamais rendre une route métier indisponible.
  }
}

export async function recordSecurityEvent(event: SecurityEvent, details: SecurityEventDetails = {}): Promise<void> {
  const payload = {
    event,
    severity: severityFor(event),
    timestamp: new Date().toISOString(),
    route: details.route || 'unknown',
    scope: details.scope || 'none',
    actor: details.actor || 'anonymous',
    status: details.status || 0,
    code: details.code || 'none'
  };

  // Vercel collecte ce JSON structuré. Aucun identifiant, token, IP ou PII n'est loggé.
  console.info(JSON.stringify({ type: 'security_event', ...payload }));
  await sendDiscordAlert(payload, event);
}
