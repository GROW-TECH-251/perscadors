import { describe, expect, it } from 'vitest';
import { readFile } from 'fs/promises';

describe('Unit — modale de soumission article', () => {
  const sourcePath = 'src/components/public/home/ArticleRequestSection.tsx';

  it('utilise un overlay fixe assombri et flouté, derrière le dialogue', async () => {
    const source = await readFile(sourcePath, 'utf-8');

    expect(source).toContain('className="fixed inset-0 z-[100]');
    expect(source).toContain('className="fixed inset-0 z-0"');
    expect(source).toContain("background: 'rgba(0,0,0,0.55)'");
    expect(source).toContain("backdropFilter: 'blur(6px)'");
    expect(source).toContain("WebkitBackdropFilter: 'blur(6px)'");
    expect(source).toContain('className="relative z-10 w-full max-w-2xl');
    expect(source).toContain('max-h-[calc(100dvh-1.5rem)]');
    expect(source).toContain('overscroll-contain touch-pan-y');
  });

  it('est rendue dans document.body pour dépasser le contexte d’empilement de ScrollReveal', async () => {
    const source = await readFile(sourcePath, 'utf-8');

    expect(source).toContain("import { createPortal } from 'react-dom';");
    expect(source).toContain("if (!show || typeof document === 'undefined') return null;");
    expect(source).toContain('document.body,');
  });

  it('bloque le scroll iOS en fixant le body et restaure la position initiale', async () => {
    const source = await readFile(sourcePath, 'utf-8');

    expect(source).toContain('const scrollY = window.scrollY;');
    expect(source).toContain("body.style.position = 'fixed';");
    expect(source).toContain('body.style.top = `-${scrollY}px`;');
    expect(source).toContain('window.scrollTo(0, scrollY);');
  });

  it('centralise toutes les fermetures sur closeArticleForm', async () => {
    const source = await readFile(sourcePath, 'utf-8');

    expect(source).toContain('const closeArticleForm = () => {');
    expect(source).toContain('closeArticleForm();');
    expect(source).toContain('onClose={closeArticleForm}');
  });
});
