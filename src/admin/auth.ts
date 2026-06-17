// src/admin/auth.ts
// ============================================
// Authentification Admin pour Next.js
// ============================================

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const ADMIN_SESSION_KEY = 'perscadors-admin-session';
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const DEFAULT_ADMIN_LOGIN = 'admin@perscadors.com';
const DEFAULT_ADMIN_PASSWORD = 'perscadors2024';

type AdminSessionProvider = 'demo' | 'supabase';

interface AdminSessionPayload {
  authenticated: true;
  identifier: string;
  provider: AdminSessionProvider;
  createdAt: string;
  expiresAt: string;
}

export const ADMIN_LOGIN_ID =
  typeof process !== 'undefined'
    ? (
        process.env.NEXT_PUBLIC_ADMIN_LOGIN_ID?.trim() ||
        process.env.VITE_ADMIN_LOGIN_ID?.trim() ||
        DEFAULT_ADMIN_LOGIN
      )
    : DEFAULT_ADMIN_LOGIN;

export const IS_ADMIN_AUTH_CONFIGURED = Boolean(
  typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_ADMIN_LOGIN_ID || process.env.VITE_ADMIN_LOGIN_ID)
);

const adminPassword =
  typeof process !== 'undefined'
    ? (
        process.env.NEXT_PUBLIC_ADMIN_PASSWORD?.trim() ||
        process.env.VITE_ADMIN_PASSWORD?.trim() ||
        DEFAULT_ADMIN_PASSWORD
      )
    : DEFAULT_ADMIN_PASSWORD;

function createSessionPayload(
  identifier: string,
  provider: AdminSessionProvider
): AdminSessionPayload {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ADMIN_SESSION_TTL_MS);

  return {
    authenticated: true,
    identifier,
    provider,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
}

function readStoredSession(): AdminSessionPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<AdminSessionPayload>;

    if (
      parsedSession.authenticated !== true ||
      typeof parsedSession.identifier !== 'string' ||
      typeof parsedSession.provider !== 'string' ||
      typeof parsedSession.createdAt !== 'string' ||
      typeof parsedSession.expiresAt !== 'string'
    ) {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return parsedSession as AdminSessionPayload;
  } catch (error) {
    console.error('Erreur lecture session admin:', error);
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

function isSessionExpired(session: AdminSessionPayload): boolean {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

export function validateDemoAdminCredentials(identifier: string, password: string): boolean {
  return (
    identifier.trim().toLowerCase() === ADMIN_LOGIN_ID.toLowerCase() &&
    password === adminPassword
  );
}

export async function signInAdmin(
  identifier: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  console.log('Tentative de connexion:', {
    identifier,
    isSupabaseConfigured,
    hasSupabase: !!supabase
  });

  if (isSupabaseConfigured && supabase) {
    try {
      console.log('Connexion via Supabase...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password
      });

      if (error) {
        console.error('Erreur Supabase:', error);

        if (validateDemoAdminCredentials(identifier, password)) {
          console.log('Fallback vers mode démo réussi');
          setAdminSession(identifier.trim(), 'demo');
          return { ok: true, message: 'Connexion démo réussie (Supabase échoué).' };
        }

        return { ok: false, message: error.message };
      }

      console.log('Connexion Supabase réussie:', data.user?.email);
      setAdminSession(identifier.trim(), 'supabase');
      return { ok: true, message: 'Connexion Supabase réussie.' };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur connexion Supabase:', errorMessage);

      if (validateDemoAdminCredentials(identifier, password)) {
        console.log('Fallback vers mode démo après erreur Supabase');
        setAdminSession(identifier.trim(), 'demo');
        return { ok: true, message: 'Connexion démo réussie (Supabase indisponible).' };
      }

      return { ok: false, message: errorMessage };
    }
  }

  console.log('Connexion via mode démo...');

  if (!validateDemoAdminCredentials(identifier, password)) {
    console.log('Identifiants démo incorrects');
    return { ok: false, message: 'Identifiants administrateur incorrects.' };
  }

  console.log('Connexion démo réussie');
  setAdminSession(identifier.trim(), 'demo');
  return { ok: true, message: 'Connexion démo réussie.' };
}

export function getAdminSession(): boolean {
  const session = readStoredSession();

  if (!session) {
    return false;
  }

  if (isSessionExpired(session)) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    return false;
  }

  return true;
}

export function getAdminSessionPayload(): AdminSessionPayload | null {
  const session = readStoredSession();

  if (!session || isSessionExpired(session)) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
    return null;
  }

  return session;
}

export function setAdminSession(
  identifier: string = ADMIN_LOGIN_ID,
  provider: AdminSessionProvider = 'demo'
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const sessionPayload = createSessionPayload(identifier, provider);
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionPayload));
}

export async function clearAdminSession(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err: unknown) {
      console.error('Erreur déconnexion Supabase:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export async function checkAdminRole(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return getAdminSession();
  }

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role === 'admin' || profile?.role === 'superadmin';
  } catch (err: unknown) {
    console.error('Erreur vérification rôle admin:', err);
    return getAdminSession();
  }
}