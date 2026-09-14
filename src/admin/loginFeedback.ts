// Formatage du compte a rebours affiche apres un blocage rate limit (429).
// La duree vient toujours du serveur (en-tete Retry-After) : cette fonction ne
// fait que la mettre en forme, sans horloge locale ni calcul de delai.

export function formatRetryCountdown(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
  const total = Math.floor(totalSeconds);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
