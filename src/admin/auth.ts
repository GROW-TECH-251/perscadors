// src/admin/auth.ts
// ============================================
// Authentification Admin
// ============================================
// Gestion de la connexion/déconnexion admin
// Supporte Supabase Auth et fallback local (démo)

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

// Clé de session dans sessionStorage
const ADMIN_SESSION_KEY = 'perscadors-admin-session';

// Identifiants admin par défaut (fallback local)
const DEFAULT_ADMIN_LOGIN = 'admin@perscadors.com';
const DEFAULT_ADMIN_PASSWORD = 'perscadors2024';

// Récupération des variables d'environnement
export const ADMIN_LOGIN_ID = import.meta.env.VITE_ADMIN_LOGIN_ID?.trim() || DEFAULT_ADMIN_LOGIN;
export const IS_ADMIN_AUTH_CONFIGURED = Boolean(
  import.meta.env.VITE_ADMIN_LOGIN_ID && import.meta.env.VITE_ADMIN_PASSWORD
);

const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;

// ============================================
// VALIDATION IDENTIFIANTS (MODE DÉMO)
// ============================================

/**
 * Valide les identifiants admin en mode démo (sans Supabase)
 */
export function validateDemoAdminCredentials(identifier: string, password: string): boolean {
  return (
    identifier.trim().toLowerCase() === ADMIN_LOGIN_ID.toLowerCase() && password === adminPassword
  );
}

// ============================================
// CONNEXION
// ============================================

/**
 * Connecte un administrateur
 * Utilise Supabase Auth si configuré, sinon fallback local
 */
export async function signInAdmin(
  identifier: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  // Mode Supabase (recommandé pour production)
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password
      });

      if (error) {
        console.error('Erreur Supabase Auth:', error);
        return { ok: false, message: error.message };
      }

      setAdminSession();
      return { ok: true, message: 'Connexion Supabase réussie.' };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur connexion Supabase:', errorMessage);
      return { ok: false, message: errorMessage };
    }
  }

  // Mode démo local (fallback)
  if (!validateDemoAdminCredentials(identifier, password)) {
    return { ok: false, message: 'Identifiants administrateur incorrects.' };
  }

  setAdminSession();
  return { ok: true, message: 'Connexion démo réussie.' };
}

// ============================================
// SESSION
// ============================================

/**
 * Vérifie si un admin est connecté
 */
export function getAdminSession(): boolean {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
}

/**
 * Marque la session comme authentifiée
 */
export function setAdminSession(): void {
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
}

/**
 * Déconnecte l'administrateur
 */
export async function clearAdminSession(): Promise<void> {
  // Déconnexion Supabase si configuré
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err: unknown) {
      console.error('Erreur déconnexion Supabase:', err);
    }
  }

  // Suppression session locale
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

// ============================================
// VÉRIFICATION RÔLE ADMIN
// ============================================

/**
 * Vérifie si l'utilisateur actuel a le rôle admin
 * Nécessite Supabase configuré
 */
export async function checkAdminRole(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    // En mode démo, on considère que c'est admin si connecté
    return getAdminSession();
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Vérifier le rôle dans la table profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role === 'admin' || profile?.role === 'superadmin';
  } catch (err: unknown) {
    console.error('Erreur vérification rôle admin:', err);
    return false;
  }
}

// ============================================
// MOT DE PASSE OUBLIÉ (Supabase uniquement)
// ============================================

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function resetPassword(email: string): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: 'Supabase n\'est pas configuré.' };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true, message: 'Email de réinitialisation envoyé.' };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    return { ok: false, message: errorMessage };
  }
}