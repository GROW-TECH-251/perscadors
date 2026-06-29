'use client';

import React from 'react';
import Image from 'next/image';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useCatalog } from '@/context/CatalogContext';
import { useCart } from '@/context/CartContext';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function HPLooksPage() {
  const { outfits } = useCatalog();
  const { addMultipleToCart } = useCart();

  // Données structurées JSON-LD E-commerce (schema.org) pour le module HPB (Looks de Vioutou)
  const looksSchema = {
    "@context": "https://schema.org",
    "@type": ["ItemList", "CollectionPage"],
    "name": "HP Collection — Les Looks de Vioutou (Module HPB)",
    "description": "Découvrez les 32 tenues streetwear exclusives créées et assemblées par l'influenceur Vioutou à Cotonou. Ajoutez un look complet à votre panier en un clic.",
    "url": "https://perscadors.vercel.app/looks",
    "image": "https://perscadors.vercel.app/images/OUTFITCOLLECTION/outfit1.jpeg",
    "numberOfItems": outfits.length,
    "itemListElement": outfits.map((o, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "CreativeWork",
        "name": o.name,
        "image": o.image,
        "url": `https://perscadors.vercel.app/looks#${o.id}`,
        "creator": {
          "@type": "Person",
          "name": "Vioutou"
        },
        "mainEntity": {
          "@type": "ItemList",
          "name": `Pièces de l'outfit ${o.name}`,
          "itemListElement": o.products.map((prod, pIndex) => ({
            "@type": "ListItem",
            "position": pIndex + 1,
            "item": {
              "@type": "Product",
              "name": prod.name,
              "image": prod.images[0],
              "url": `https://perscadors.vercel.app/produit/${prod.id}`,
              "offers": {
                "@type": "Offer",
                "priceCurrency": "XOF",
                "price": prod.price
              }
            }
          }))
        }
      }
    }))
  };

  return (
    <PublicLayout>
      <title>HP Looks | Inspirations Streetwear de Vioutou à Cotonou</title>
      <meta name="description" content="Découvrez les 32 tenues streetwear exclusives créées par l'influenceur Vioutou à Cotonou. Ajoutez un look complet à votre panier en un clic." />
      <meta property="og:title" content="HP Looks | Inspirations Streetwear de Vioutou à Cotonou" />
      <meta property="og:description" content="Découvrez les 32 tenues streetwear exclusives créées par l'influenceur Vioutou à Cotonou. Ajoutez un look complet à votre panier en un clic." />
      <meta property="og:image" content="/images/OUTFITCOLLECTION/outfit1.jpeg" />
      <meta property="og:url" content="https://perscadors.vercel.app/looks" />
      <meta property="og:type" content="website" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(looksSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-brand-text-muted hover:text-brand-gold transition-colors font-bebas text-lg uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> Retour à l&apos;accueil
          </Link>
          <span className="text-sm text-brand-text-muted bg-brand-bg-alt px-3 py-1 rounded-full border border-brand-gold/10">
            {outfits.length} Looks de Vioutou
          </span>
        </div>

        <div className="text-center mb-16">
          <h1 className="font-bebas text-5xl sm:text-7xl text-brand-gold uppercase tracking-wider leading-none mb-4">
            HP Looks de Vioutou
          </h1>
          <div className="w-20 h-1 bg-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted max-w-xl mx-auto text-base sm:text-lg">
            Tous les outfits streetwear les plus stylés du Bénin. Trouve le look complet qui te correspond et recrée-le instantanément.
          </p>
        </div>

        {outfits.length === 0 ? (
          <div className="text-center py-16 bg-brand-bg-alt rounded-2xl border border-brand-gold/10">
            <p className="font-bebas text-2xl text-brand-text uppercase">Aucun look disponible</p>
            <p className="text-brand-text-muted mt-2">Ajoute des produits visibles dans l&apos;admin pour générer automatiquement les looks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {outfits.map((outfit) => (
              <div
                key={outfit.id}
                className="bg-brand-bg-alt border border-brand-gold/15 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative w-full aspect-[4/5] bg-brand-bg">
                  <Image
                    src={outfit.image}
                    alt={outfit.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />

                  <div className="absolute top-4 left-4 bg-brand-gold text-brand-bg font-bebas text-sm uppercase px-3 py-1 rounded tracking-wider shadow">
                    Vioutou Outfit 🔥
                  </div>
                </div>

                <div className="p-6 space-y-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-bebas text-3xl text-brand-text tracking-wider uppercase mb-3">
                      {outfit.name}
                    </h3>

                    <p className="text-xs text-brand-text-muted mb-4 uppercase tracking-widest font-semibold border-b border-brand-gold/10 pb-2">
                      Pièces de cet outfit :
                    </p>

                    <div className="space-y-3">
                      {outfit.products.map((product) => (
                        <Link
                          key={`${outfit.id}-${product.id}`}
                          href={`/produit/${product.id}`}
                          className="flex items-center gap-3 p-2 bg-brand-bg hover:bg-brand-bg-alt border border-brand-gold/5 rounded-lg transition-colors group cursor-pointer"
                        >
                          <div className="relative w-10 h-12 overflow-hidden rounded bg-brand-bg flex-shrink-0">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-bebas text-md text-brand-text truncate leading-tight group-hover:text-brand-gold transition-colors">
                              {product.name}
                            </h4>
                            <span className="text-[10px] text-brand-text-muted uppercase tracking-wider block">
                              {product.category.replace(/-/g, ' ')}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-brand-gold">
                            {product.price.toLocaleString()} FCFA
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-brand-gold/10">
                    <div className="flex justify-between items-center text-md font-semibold">
                      <span className="font-bebas text-brand-text-muted">Total du Look</span>
                      <span className="text-xl font-bold text-brand-gold">
                        {outfit.price.toLocaleString()} FCFA
                      </span>
                    </div>

                    <button
                      onClick={() => addMultipleToCart(outfit.products)}
                      className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-light text-brand-bg font-bebas text-lg uppercase tracking-widest rounded transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={16} />
                      Recréer ce look
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}