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

export async function signInAdmin(identifier: string, password: string, captchaToken: string | null): Promise<{ ok: boolean; message: string }> {
  if (!captchaToken) return { ok: false, message: 'Veuillez terminer la vérification anti-bot.' };

  try {
    const response = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier.trim(), password, captchaToken })
    });
    const result = await response.json() as { ok?: boolean; message?: string };
    if (!response.ok || !result.ok) {
      return { ok: false, message: result.message || 'Connexion indisponible. Réessayez.' };
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
