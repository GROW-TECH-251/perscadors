'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = 'cloudflare-turnstile-script';

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile indisponible.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile indisponible.'));
    document.head.appendChild(script);
  });
}

interface TurnstileWidgetProps {
  action: 'admin_login' | 'checkout';
  onTokenChange: (token: string | null) => void;
  onError?: () => void;
}

export function TurnstileWidget({ action, onTokenChange, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbackRef = useRef(onTokenChange);
  const errorRef = useRef(onError);
  useEffect(() => {
    callbackRef.current = onTokenChange;
    errorRef.current = onError;
  }, [onTokenChange, onError]);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          callback: (token: string) => callbackRef.current(token),
          'expired-callback': () => callbackRef.current(null),
          'error-callback': () => {
            callbackRef.current(null);
            errorRef.current?.();
          }
        });
      })
      .catch(() => errorRef.current?.());

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [action, siteKey]);

  if (!siteKey) {
    return <p className="text-sm text-red-500">La protection anti-bot est indisponible. Réessayez plus tard.</p>;
  }

  return <div ref={containerRef} className="min-h-[65px]" aria-label="Vérification anti-bot" />;
}
