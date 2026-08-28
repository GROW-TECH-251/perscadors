import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou contre la régression "Footer" :
// - l'ancre "Avis Clients" doit pointer vers #testimonials (id réel de la
//   section) et non plus #temoinages (lien cassé) ;
// - le drapeau du Bénin doit respecter le ratio réel 2:3 (hauteur:largeur),
//   rendu via un viewBox 300×200, sans dimensions en pixels codées en dur.
describe('Unit — Footer (drapeau Bénin + ancre)', () => {
  it('l ancre Avis Clients doit pointer vers #testimonials', async () => {
    const footer = await readFile('src/components/public/layout/Footer.tsx', 'utf-8');
    expect(footer).toContain('href="/#testimonials"');
    expect(footer).not.toContain('#temoinages');
  });

  it('le drapeau doit utiliser un viewBox au ratio 2:3 (300×200)', async () => {
    const footer = await readFile('src/components/public/layout/Footer.tsx', 'utf-8');
    expect(footer).toContain('viewBox="0 0 300 200"');
    expect(footer).not.toContain('width="82"');
    expect(footer).not.toContain('height="70"');
  });

  it('les trois couleurs officielles du drapeau béninois doivent être présentes', async () => {
    const footer = await readFile('src/components/public/layout/Footer.tsx', 'utf-8');
    expect(footer).toContain('#008751'); // vert
    expect(footer).toContain('#FCD116'); // jaune
    expect(footer).toContain('#E8112D'); // rouge
  });
});
