import Link from 'next/link';
import type { Metadata } from 'next';
import { Home, Search } from 'lucide-react';

// SEO (31/10) — page 404 brandée : renvoyée par notFound() (produits
// inexistants/masqués) et toute URL inconnue. Avant, les pages « Article
// introuvable » répondaient 200 (soft-404). Français, design system, deux
// sorties utiles (accueil + catalogue) pour ne pas perdre le visiteur.

export const metadata: Metadata = {
  title: 'Page introuvable | HP Collection',
  description: 'Cette page n’existe plus ou a été déplacée. Retrouvez les collections streetwear HP Collection à Cotonou, Bénin.',
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-brand-bg px-4 pt-32 pb-20">
      <div className="max-w-xl w-full text-center space-y-6">
        <p className="font-bebas text-8xl text-brand-gold tracking-wider leading-none">404</p>
        <h1 className="font-bebas text-4xl sm:text-5xl text-brand-text uppercase tracking-wider leading-tight">
          Page introuvable
        </h1>
        <p className="text-brand-text-muted leading-relaxed">
          Cette page n’existe plus ou a été déplacée. Les collections HP Collection
          restent disponibles — retournez à l’accueil ou parcourez le catalogue.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-gold text-brand-bg font-bebas text-lg uppercase tracking-wider px-7 py-3.5 rounded-xl shadow-xl transition hover:bg-brand-gold-light"
          >
            <Home size={18} /> Retour à l’accueil
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 border border-brand-gold/30 hover:border-brand-gold text-brand-text font-bebas text-lg uppercase tracking-wider px-7 py-3.5 rounded-xl transition"
          >
            <Search size={18} /> Voir les collections
          </Link>
        </div>
      </div>
    </div>
  );
}
