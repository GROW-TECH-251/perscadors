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

export async function signInAdmin(identifier: string, password: string): Promise<{ ok: boolean; message: string }> {
  if (!supabase) return { ok: false, message: 'La connexion administrateur est indisponible. Contactez l’administrateur.' };

  const { data, error } = await supabase.auth.signInWithPassword({ email: identifier.trim(), password });
  if (error || !data.user) return { ok: false, message: 'Identifiant ou mot de passe incorrect.' };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile || !['admin', 'superadmin'].includes(profile.role)) {
    await supabase.auth.signOut();
    return { ok: false, message: 'Ce compte ne possède pas les droits d’administration.' };
  }

  persistSession(data.user.email || identifier.trim());
  return { ok: true, message: 'Connexion réussie.' };
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
  return Boolean(profile && ['admin', 'superadmin'].includes(profile.role));
}
