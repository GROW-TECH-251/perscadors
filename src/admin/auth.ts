// src/admin/auth.ts
// ============================================
// Authentification Admin pour Next.js
// ============================================

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const ADMIN_SESSION_KEY = 'perscadors-admin-session';

// Identifiants démo (fallback)
const DEFAULT_ADMIN_LOGIN = 'admin@perscadors.com';
const DEFAULT_ADMIN_PASSWORD = 'perscadors2024';

// Récupération des variables d'environnement (Next.js)
export const ADMIN_LOGIN_ID = 
  typeof process !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_ADMIN_LOGIN_ID?.trim() || 
       process.env.VITE_ADMIN_LOGIN_ID?.trim() || 
       DEFAULT_ADMIN_LOGIN)
    : DEFAULT_ADMIN_LOGIN;

export const IS_ADMIN_AUTH_CONFIGURED = Boolean(
  typeof process !== 'undefined' &&
  (process.env.NEXT_PUBLIC_ADMIN_LOGIN_ID || process.env.VITE_ADMIN_LOGIN_ID)
);

const adminPassword = 
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ADMIN_PASSWORD?.trim() || 
       process.env.VITE_ADMIN_PASSWORD?.trim() || 
       DEFAULT_ADMIN_PASSWORD)
    : DEFAULT_ADMIN_PASSWORD;

export function validateDemoAdminCredentials(identifier: string, password: string): boolean {
  return (
    identifier.trim().toLowerCase() === ADMIN_LOGIN_ID.toLowerCase() && password === adminPassword
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

  // Mode Supabase (si configuré)
  if (isSupabaseConfigured && supabase) {
    try {
      console.log('Connexion via Supabase...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password
      });

      if (error) {
        console.error('Erreur Supabase:', error);
        // Si Supabase échoue, on essaie le mode démo
        if (validateDemoAdminCredentials(identifier, password)) {
          console.log('Fallback vers mode démo réussi');
          setAdminSession();
          return { ok: true, message: 'Connexion démo réussie (Supabase échoué).' };
        }
        return { ok: false, message: error.message };
      }

      console.log('Connexion Supabase réussie:', data.user?.email);
      setAdminSession();
      return { ok: true, message: 'Connexion Supabase réussie.' };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur connexion Supabase:', errorMessage);
      
      // Fallback vers mode démo
      if (validateDemoAdminCredentials(identifier, password)) {
        console.log('Fallback vers mode démo après erreur Supabase');
        setAdminSession();
        return { ok: true, message: 'Connexion démo réussie (Supabase indisponible).' };
      }
      
      return { ok: false, message: errorMessage };
    }
  }

  // Mode démo (fallback)
  console.log('Connexion via mode démo...');
  
  if (!validateDemoAdminCredentials(identifier, password)) {
    console.log('Identifiants démo incorrects');
    return { ok: false, message: 'Identifiants administrateur incorrects.' };
  }

  console.log('Connexion démo réussie');
  setAdminSession();
  return { ok: true, message: 'Connexion démo réussie.' };
}

export function getAdminSession(): boolean {
  // Côté client uniquement
  if (typeof window !== 'undefined') {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
  }
  return false;
}

export function setAdminSession(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
  }
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
    const { data: { user } } = await supabase.auth.getUser();

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
