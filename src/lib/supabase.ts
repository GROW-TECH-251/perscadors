// src/lib/supabase.ts
// ============================================
// Configuration du client Supabase
// ============================================
// Ce fichier initialise la connexion à Supabase
// Il est utilisé par tous les services (products, orders, customers, etc.)

import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

// Vérification de la configuration
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Création du client Supabase (seulement si configuré)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Fonction utilitaire pour exiger Supabase
// À utiliser dans les fonctions qui ont absolument besoin de Supabase
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase n\'est pas configuré. ' +
      'Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.'
    );
  }
  return supabase;
}

// Types pour l'authentification admin
export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'superadmin';
}

// Fonction pour vérifier si un utilisateur est admin
export async function checkAdminRole(userId: string): Promise<boolean> {
  if (!supabase) return false;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error || !data) return false;
  return data.role === 'admin' || data.role === 'superadmin';
}