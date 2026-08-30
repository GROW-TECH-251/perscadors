'use client';

// IMP-05 — Wrapper de révélation au scroll pour les sections publiques.
// 'use client' minimal : les enfants fournis par la page serveur restent
// rendus dans le HTML initial (SEO intact) ; le masquage temporaire n'est
// appliqué qu'après hydration par useScrollReveal.

import React from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ children, className }) => {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
};
