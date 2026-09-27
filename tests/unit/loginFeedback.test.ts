import { describe, it, expect } from 'vitest';
import { formatRetryCountdown } from '@/admin/loginFeedback';

describe('formatRetryCountdown (E8 — compte à rebours rate limit)', () => {
  it('retourne une chaîne vide pour 0 seconde', () => {
    expect(formatRetryCountdown(0)).toBe('');
  });

  it('retourne une chaîne vide pour une valeur négative', () => {
    expect(formatRetryCountdown(-30)).toBe('');
  });

  it('retourne une chaîne vide pour NaN', () => {
    expect(formatRetryCountdown(Number.NaN)).toBe('');
  });

  it('retourne une chaîne vide pour Infinity', () => {
    expect(formatRetryCountdown(Number.POSITIVE_INFINITY)).toBe('');
  });

  it('formate 59 secondes', () => {
    expect(formatRetryCountdown(59)).toBe('00:59');
  });

  it('formate 60 secondes', () => {
    expect(formatRetryCountdown(60)).toBe('01:00');
  });

  it('formate 901 secondes (15 minutes et 1 seconde)', () => {
    expect(formatRetryCountdown(901)).toBe('15:01');
  });

  it('formate 3599 secondes', () => {
    expect(formatRetryCountdown(3599)).toBe('59:59');
  });

  it('tronque les décimales (90,9 s -> 01:30)', () => {
    expect(formatRetryCountdown(90.9)).toBe('01:30');
  });
});
