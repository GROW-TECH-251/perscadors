import { supabase } from '@/lib/supabase';

const ADMIN_SESSION_KEY = 'perscadors-admin-session';
type AdminSessionProvider = 'supabase';

interface AdminSessionPayload {
  authenticated: true;
  identifier: string;
  provider: AdminSessionProvider;
  createdAt: string;
}

function persistSession(identifier: string): void {
  if (typeof window === 'undefined') return;
  const payload: AdminSessionPayload = { authenticated: true, identifier, provider: 'supabase', createdAt: new Date().toISOString() };
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
}

function clearSession(): void {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function hasSupabaseAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((entry) => entry.trim().startsWith('sb-') && entry.includes('auth-token'));
}

export interface AdminSignInResult {
  ok: boolean;
  message: string;
  retryAfterSeconds?: number;
}

export async function signInAdmin(identifier: string, password: string, captchaToken: string | null): Promise<AdminSignInResult> {
  if (!captchaToken) return { ok: false, message: 'Veuillez terminer la vérification anti-bot.' };

  try {
    const response = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier.trim(), password, captchaToken })
    });
    // E8 : un corps non JSON ne doit plus masquer le statut réel de la réponse.
    let result: { ok?: boolean; message?: string } = {};
    try {
      result = await response.json() as { ok?: boolean; message?: string };
    } catch {
      // Corps illisible : le statut HTTP et Retry-After restent exploitables.
    }
    // E8 : le serveur renvoie deja Retry-After sur les 429 — même origine, donc
    // toujours lisible. C'est la source la plus fiable pour le compte a rebours.
    const retryAfterRaw = Number.parseInt(response.headers.get('Retry-After') ?? '', 10);
    const retryAfterSeconds = Number.isFinite(retryAfterRaw) && retryAfterRaw > 0 ? retryAfterRaw : undefined;
    if (!response.ok || !result.ok) {
      return { ok: false, message: result.message || 'Connexion indisponible. Réessayez.', retryAfterSeconds };
    }

    persistSession(identifier.trim());
    return { ok: true, message: 'Connexion réussie.' };
  } catch {
    return { ok: false, message: 'Connexion indisponible. Réessayez.' };
  }
}

export function getAdminSession(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
  return Boolean(stored) || hasSupabaseAuthCookie();
}

export async function clearAdminSession(): Promise<void> {
  clearSession();
  if (supabase) await supabase.auth.signOut();
}

export async function checkAdminRole(): Promise<boolean> {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return Boolean(profile && profile.role === 'admin');
}
