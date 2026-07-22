export type SupabaseErrorKind = 'network' | 'rls' | 'storage' | 'validation' | 'unknown';

export interface AppSupabaseError {
  kind: SupabaseErrorKind;
  userMessage: string;
  technicalMessage: string;
}

export function normalizeSupabaseError(error: unknown, context: string): AppSupabaseError {
  const candidate = error as { message?: string; code?: string; status?: number } | null;
  const technicalMessage = candidate?.message || String(error || 'Erreur inconnue');
  const code = candidate?.code || '';
  const message = technicalMessage.toLowerCase();

  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return { kind: 'rls', userMessage: 'Votre compte ne possède pas les permissions nécessaires pour cette action.', technicalMessage };
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch') || candidate?.status === 0) {
    return { kind: 'network', userMessage: 'La connexion à la boutique est indisponible. Réessayez dans un instant.', technicalMessage };
  }
  if (context === 'storage' || message.includes('bucket') || message.includes('storage')) {
    return { kind: 'storage', userMessage: 'Le fichier n’a pas pu être traité par le stockage.', technicalMessage };
  }
  return { kind: 'unknown', userMessage: 'Une erreur serveur est survenue. Réessayez dans un instant.', technicalMessage };
}

/** Les erreurs attendues sont journalisées sans console.error pour éviter l’overlay Turbopack. */
export function logSupabaseWarning(context: string, error: unknown): AppSupabaseError {
  const normalized = normalizeSupabaseError(error, context);
  console.warn(`[Perscadors:${context}:${normalized.kind}]`, normalized.technicalMessage);
  return normalized;
}
