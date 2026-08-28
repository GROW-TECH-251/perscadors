import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou contre la régression "Témoignages invisibles en vitrine" :
// le schéma stocké est un OBJET TestimonialsData { screenshot_url,
// screenshot_quote, videos[] }, pas un tableau de { name, quote, city }.
// L'ancien code testait Array.isArray(...) et retombait toujours sur les
// citations codées en dur, rendant le travail admin invisible.
describe('Unit — Témoignages (schéma stocké vs tableau)', () => {
  it('le composant doit consommer le schéma objet TestimonialsData', async () => {
    const component = await readFile('src/components/public/home/Testimonials.tsx', 'utf-8');
    expect(component).not.toContain('Array.isArray(data.testimonials_json)');
    expect(component).toContain('screenshot_url');
    expect(component).toContain('.videos');
    expect(component).toContain('data.testimonials_json');
  });

  it('le composant doit afficher les vidéos et la capture du schéma stocké', async () => {
    const component = await readFile('src/components/public/home/Testimonials.tsx', 'utf-8');
    expect(component).toContain('<video');
    expect(component).toContain('preload="metadata"');
    expect(component).toContain('screenshot_quote');
  });

  it('la capture par défaut ne doit plus pointer vers un fichier inexistant', async () => {
    const service = await readFile('src/services/settingsService.ts', 'utf-8');
    expect(service).not.toContain("screenshot_url: '/assets/testimonials");
    expect(service).toContain("screenshot_url: ''");
  });
});
