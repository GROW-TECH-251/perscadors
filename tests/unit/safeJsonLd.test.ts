import { describe, it, expect } from 'vitest';

function sanitizeJsonLd(value: string): string {
  return value.replace(/<\/script>/gi, '\\u003c/script\\u003e');
}

describe('Unit — safeJsonLd', () => {
  it('fermeture </script> doit être neutralisée', () => {
    const input = '<script>data</script><script>alert(1)</script>';
    const result = sanitizeJsonLd(input);
    expect(result).toContain('\\u003c/script\\u003e');
    expect(result).not.toContain('</script>');
  });

  it('JSON final doit rester parseable', () => {
    const raw = '{"name":"Produit","description":"Un bon produit"}';
    const sanitized = sanitizeJsonLd(raw);
    expect(JSON.parse(sanitized)).toEqual({ name: 'Produit', description: 'Un bon produit' });
  });

  it('chaîne sans balise script doit rester inchangée', () => {
    const input = 'Hello world';
    expect(sanitizeJsonLd(input)).toBe('Hello world');
  });
});
