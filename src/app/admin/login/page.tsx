// src/app/admin/login/page.tsx
// ============================================
// Login Admin Next.js (Zéro Hydration Mismatch)
// ============================================

'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { checkAdminRole, signInAdmin } from '@/admin/auth';
import { AdminInput, AdminButton } from '@/admin/components';
import { TurnstileWidget, type TurnstileWidgetHandle } from '@/components/security/TurnstileWidget';
import { formatRetryCountdown } from '@/admin/loginFeedback';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    let to = '/admin';
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const rawRedirect = searchParams.get('redirect');
      if (rawRedirect && rawRedirect.startsWith('/admin')) {
        to = rawRedirect;
      }
    }
    router.replace(to);
  }, [router]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
        <p className="text-brand-text-muted">Redirection vers le dashboard...</p>
      </div>
    </div>
  );
}

const subscribeNoop = () => () => {};

// E8 : message d'arrivee selon les parametres que le proxy ajoute deja :
// ?redirect=/admin/... (session absente/expiree) ou ?reason=unauthorized.
// Lu via useSyncExternalStore : rendu serveur vide, valeur client appliquee
// apres hydratation — aucun setState dans un effet, aucun mismatch.
function lireBanniereArrivee(): string {
  const params = new URLSearchParams(window.location.search);
  if (params.get('reason') === 'unauthorized') {
    return 'Ce compte ne possède pas les droits d’administration.';
  }
  if (params.get('redirect')?.startsWith('/admin')) {
    return 'Votre session a expiré ou a été fermée. Reconnectez-vous pour continuer.';
  }
  return '';
}

export default function AdminLoginPage() {
  const router = useRouter();
  // E8 : bandeau d'arrivee (session expiree / compte non autorise).
  const notice = useSyncExternalStore(subscribeNoop, lireBanniereArrivee, () => '');
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileWidgetHandle>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => {
    let active = true;
    checkAdminRole()
      .then((isAdmin) => {
        if (!active) return;
        setIsAuthenticated(isAdmin);
      })
      .catch(() => {
        if (!active) return;
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => { active = false; };
  }, []);

  // E8 : decompte du delai rate limit recu du serveur (Retry-After).
  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setInterval(() => setRetryCountdown((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryCountdown]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || retryCountdown > 0) return;
    setError('');
    setLoading(true);

    try {
      const result = await signInAdmin(identifier, password, captchaToken);

      if (result.ok) {
        let to = '/admin';
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          const rawRedirect = searchParams.get('redirect');
          if (rawRedirect && rawRedirect.startsWith('/admin')) {
            to = rawRedirect;
          }
        }
        router.replace(to);
      } else {
        setError(result.message);
        if (result.retryAfterSeconds && result.retryAfterSeconds > 0) setRetryCountdown(result.retryAfterSeconds);
        // E8 : tout echec a potentiellement consomme le token (usage unique) —
        // on rejoue le defi Turnstile automatiquement, sans rechargement.
        captchaRef.current?.reset();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return <div className="min-h-screen bg-brand-bg" aria-busy="true" />;
  }

  if (isAuthenticated) {
    return <LoginRedirect />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7df,transparent_42%),linear-gradient(180deg,#f5f0e8_0%,#efe8db_100%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-48 h-16 mx-auto mb-4">
            <Image
              src="/assets/brand/logo.png"
              alt="HP Collection"
              fill
              sizes="192px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
            Administration
          </h1>
          <p className="text-brand-text-muted mt-2">
            Connectez-vous pour gérer votre boutique
          </p>
        </div>

        <div className="bg-brand-bg-alt/95 border border-brand-gold/15 rounded-3xl p-8 shadow-[0_24px_60px_rgba(10,10,10,0.1)] backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {notice && (
              <div className="flex items-center gap-2 p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-lg text-brand-text-muted text-sm">
                <AlertCircle size={18} />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <AdminInput
              label="Identifiant"
              value={identifier}
              onChange={setIdentifier}
              type="email"
              placeholder="admin@perscadors.com"
              required
              disabled={loading}
            />

            <AdminInput
              label="Mot de passe"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              required
              disabled={loading}
            />

            <TurnstileWidget
              ref={captchaRef}
              action="admin_login"
              onTokenChange={setCaptchaToken}
              onError={() => setError('La vérification anti-bot est indisponible. Réessayez.')}
            />

            {retryCountdown > 0 && (
              <p className="text-center text-sm text-brand-text-muted" data-testid="retry-countdown">
                Nouvelle tentative possible dans {formatRetryCountdown(retryCountdown)}.
              </p>
            )}

            <AdminButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || !captchaToken || retryCountdown > 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  Se connecter
                </>
              )}
            </AdminButton>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-brand-text-muted">
            Vous n&apos;avez pas accès ? Contactez l&apos;administrateur de la boutique.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-brand-text-muted hover:text-brand-gold text-sm transition-colors"
          >
            ← Retour à la boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
