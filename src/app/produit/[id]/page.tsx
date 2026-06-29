'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useCatalog } from '@/context/CatalogContext';
import { useCart } from '@/context/CartContext';
import { Product, Size } from '@/types';
import { ArrowLeft, MessageSquareCode, ShoppingBag, Check } from 'lucide-react';

interface ProductDetailContentProps {
  product: Product;
  suggestions: Product[];
}

function ProductDetailContent({ product, suggestions }: ProductDetailContentProps) {
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState<string>(product.images[0] ?? '');
  const [selectedSize, setSelectedSize] = useState<Size | null>(
    product.sizes.find((size) => !product.outOfStockSizes?.includes(size)) || product.sizes[0] || null
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors.find((color) => !product.outOfStockColors?.includes(color)) || product.colors[0] || ''
  );
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isAddedToCart, setIsAddedToCart] = useState<boolean>(false);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setErrorMsg('Veuillez sélectionner une taille.');
      return;
    }

    if (!selectedColor) {
      setErrorMsg('Veuillez sélectionner une couleur.');
      return;
    }

    setErrorMsg('');
    addToCart(product, selectedSize, selectedColor);
    
    // Premium haptic visual feedback for cart addition
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 1400);
  };

  const handleDealWhatsApp = () => {
    if (!selectedSize) {
      setErrorMsg('Veuillez sélectionner une taille.');
      return;
    }

    if (!selectedColor) {
      setErrorMsg('Veuillez sélectionner une couleur.');
      return;
    }

    setErrorMsg('');

    const message =
      `👑 *HP COLLECTION - DEAL AVEC VIOUTOU* 👑\n\n` +
      `Salut Vioutou ! Je souhaite commander cet article en direct :\n\n` +
      `📦 *Produit :* ${product.name}\n` +
      `📏 *Taille :* ${selectedSize}\n` +
      `🎨 *Couleur :* ${selectedColor}\n` +
      `💰 *Prix :* ${product.price.toLocaleString()} FCFA\n\n` +
      `📍 _Livraison partout au Bénin._\n` +
      `Peux-tu me confirmer la dispo ? Merci ! 🙌`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/22967280018?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
      <div className="mb-8">
        <Link
          href={`/categorie/${product.category}`}
          className="inline-flex items-center gap-2 text-brand-text-muted hover:text-brand-gold transition-colors font-bebas text-lg uppercase tracking-wider group"
        >
          <ArrowLeft size={16} className="transform transition-transform group-hover:-translate-x-1" /> 
          Retour à la catégorie
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">
        {/* Gallery Section - Enhanced Premium Depth & Interactive Thumbnails */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-3xl border border-brand-gold/15 bg-brand-bg-alt shadow-[0_20px_50px_rgba(10,10,10,0.5)] group">
            {selectedImage && (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-[850ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.05]"
              />
            )}

            {/* Premium subtle inner vignetting */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/40 via-transparent to-transparent pointer-events-none z-10" />

            {!product.inStock && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[4px] flex items-center justify-center z-20">
                <span className="border border-red-500/30 bg-red-600 text-white font-bebas text-3xl uppercase tracking-widest px-8 py-4 rounded-2xl transform -rotate-12 shadow-[0_10px_25px_rgba(220,38,38,0.4)]">
                  Rupture de Stock
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto py-2 scrollbar-none">
            {product.images.map((image, index) => {
              const isSelected = selectedImage === image;
              return (
                <button
                  key={image}
                  onClick={() => setSelectedImage(image)}
                  aria-label={`Sélectionner l'angle ${index + 1} pour ${product.name}`}
                  title={`Angle ${index + 1}`}
                  className={`relative w-20 sm:w-24 aspect-[3/4] flex-shrink-0 overflow-hidden rounded-2xl border-2 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 ${
                    isSelected 
                      ? 'border-brand-gold shadow-[0_0_15px_rgba(184,149,42,0.35)] scale-[1.02]' 
                      : 'border-brand-gold/15 hover:border-brand-gold/50 opacity-70 hover:opacity-100 hover:scale-[1.01]'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} angle ${index + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Details Section - Immersive Premium Layout */}
        <div className="lg:col-span-6 p-6 sm:p-10 bg-brand-bg-alt border border-brand-gold/15 rounded-3xl shadow-[0_25px_60px_rgba(10,10,10,0.45)] space-y-8 backdrop-blur-sm relative">
          <div>
            <span className="inline-block text-xs text-brand-gold tracking-[0.25em] uppercase font-semibold bg-brand-gold/10 px-3.5 py-1 rounded-full border border-brand-gold/20 mb-3">
              {product.category.replace(/-/g, ' ')}
            </span>
            <h1 className="font-bebas text-4xl sm:text-6xl text-brand-text tracking-wider uppercase leading-none mb-4 drop-shadow-sm">
              {product.name}
            </h1>
            <div className="font-bebas text-3xl sm:text-4xl tracking-wider text-brand-gold">
              {product.price.toLocaleString()} FCFA
            </div>
          </div>

          <p className="text-sm sm:text-base text-brand-text-muted leading-relaxed font-light">
            {product.description}
          </p>

          {/* Premium Size Selector with Micro-interactions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bebas text-lg tracking-wider text-brand-text-muted uppercase">
                Sélectionner la Taille
              </h3>
              <span className="text-xs text-brand-gold hover:underline cursor-pointer tracking-wider font-bebas uppercase">
                Guide des tailles
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.sizes.map((size) => {
                const isOutOfStock = product.outOfStockSizes?.includes(size);
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(size)}
                    className={`relative px-5 py-3 font-bebas text-lg tracking-wider rounded-2xl border transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                      isOutOfStock
                        ? 'border-gray-800 text-gray-600 bg-gray-900/40 line-through cursor-not-allowed opacity-40'
                        : isSelected
                          ? 'bg-brand-gold border-brand-gold text-[#0A0A0A] shadow-[0_10px_20px_rgba(184,149,42,0.3)] scale-[1.03]'
                          : 'border-brand-gold/20 hover:border-brand-gold/60 text-brand-text bg-brand-bg hover:scale-[1.02]'
                    }`}
                  >
                    {isSelected && <Check size={16} className="text-[#0A0A0A] stroke-[3]" />}
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Premium Color Selector with Micro-interactions */}
          <div className="space-y-4">
            <h3 className="font-bebas text-lg tracking-wider text-brand-text-muted uppercase">
              Sélectionner la Couleur
            </h3>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => {
                const isOutOfStock = product.outOfStockColors?.includes(color);
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedColor(color)}
                    className={`relative px-6 py-3 font-bebas text-lg tracking-wider rounded-full border transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                      isOutOfStock
                        ? 'border-gray-800 text-gray-600 bg-gray-900/40 line-through cursor-not-allowed opacity-40'
                        : isSelected
                          ? 'bg-brand-gold border-brand-gold text-[#0A0A0A] shadow-[0_10px_20px_rgba(184,149,42,0.3)] scale-[1.03]'
                          : 'border-brand-gold/20 hover:border-brand-gold/60 text-brand-text bg-brand-bg hover:scale-[1.02]'
                    }`}
                  >
                    {isSelected && <Check size={16} className="text-[#0A0A0A] stroke-[3]" />}
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <p className="text-sm font-semibold text-red-600 bg-red-950/50 p-4 rounded-2xl border border-red-800/50 backdrop-blur-sm animate-shake flex items-center gap-2">
              <span className="text-lg">⚠️</span> {errorMsg}
            </p>
          )}

          {/* Luxury High-Impact Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-brand-gold/10">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full py-4.5 font-bebas text-xl uppercase tracking-widest rounded-2xl transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center gap-2.5 cursor-pointer border active:scale-[0.98] ${
                !product.inStock
                  ? 'border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed'
                  : isAddedToCart
                    ? 'bg-green-600 border-green-600 text-white shadow-[0_10px_25px_rgba(22,163,74,0.35)]'
                    : 'border-brand-gold hover:bg-brand-gold hover:text-[#0A0A0A] text-brand-gold bg-transparent hover:shadow-[0_15px_30px_-10px_rgba(184,149,42,0.4)] hover:scale-[1.02]'
              }`}
            >
              {isAddedToCart ? (
                <>
                  <Check size={20} className="text-white animate-scale-in" />
                  Ajouté au panier !
                </>
              ) : (
                <>
                  <ShoppingBag size={20} />
                  Ajouter au panier
                </>
              )}
            </button>

            <button
              onClick={handleDealWhatsApp}
              className="w-full py-4.5 bg-brand-gold hover:bg-brand-gold-light active:bg-[#9F7F1F] text-[#0A0A0A] font-bebas text-xl uppercase tracking-widest rounded-2xl transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_15px_30px_-10px_rgba(184,149,42,0.4)] hover:shadow-[0_20px_40px_-12px_rgba(184,149,42,0.6)] flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageSquareCode size={20} />
              Deal avec Vioutou
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions Section - Harmonized Premium Collection Cards */}
      <section className="border-t border-brand-gold/15 pt-20">
        <div className="mb-12 text-center sm:text-left">
          <h2 className="font-bebas text-4xl sm:text-5xl tracking-wider text-brand-gold uppercase mb-3">
            Complète le look
          </h2>
          <div className="w-20 h-1 bg-brand-gold mx-auto sm:mx-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion.id}
              href={`/produit/${suggestion.id}`}
              className="relative group bg-brand-bg-alt border border-brand-gold/10 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-brand-gold/5 hover:ring-brand-gold/25 transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
            >
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-brand-bg">
                <Image
                  src={suggestion.images[0]}
                  alt={suggestion.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-[850ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.08]"
                />
                
                {/* Premium subtle inner gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

                {!suggestion.inStock && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-20">
                    <span className="border border-red-500/30 bg-red-600 text-white font-bebas text-md uppercase tracking-wider px-3 py-1.5 rounded-xl">
                      Rupture
                    </span>
                  </div>
                )}
              </div>

              <div className="relative z-20 p-6 flex-grow flex flex-col justify-between gap-2 bg-brand-bg-alt/90 backdrop-blur-sm">
                <h3 className="font-bebas text-xl text-brand-text tracking-wider uppercase line-clamp-1 leading-tight group-hover:text-brand-gold transition-colors">
                  {suggestion.name}
                </h3>
                <span className="font-bebas text-2xl tracking-wider text-brand-gold">
                  {suggestion.price.toLocaleString()} FCFA
                </span>
              </div>

              {/* Premium subtle bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-brand-gold/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ProductPage() {
  const params = useParams();
  const { products, findProductById } = useCatalog();
  const id = params.id as string;

  const product = useMemo(() => findProductById(id), [findProductById, id]);
  const suggestions = useMemo(
    () => products.filter((currentProduct) => currentProduct.id !== product?.id && (currentProduct.category === product?.category || currentProduct.isPopular)).slice(0, 4),
    [product, products]
  );

  if (!product) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 pt-32 pb-24 text-center space-y-6">
          <span className="text-5xl block animate-bounce">⚠️</span>
          <h1 className="font-bebas text-5xl text-brand-text tracking-wider uppercase">Article introuvable</h1>
          <p className="text-brand-text-muted max-w-md mx-auto">
            Cet article n&apos;est plus disponible dans le catalogue ou l&apos;URL est incorrecte.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-brand-gold hover:bg-brand-gold-light text-[#0A0A0A] font-bebas text-xl uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(184,149,42,0.3)] transition-all hover:scale-[1.02]"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <ProductDetailContent
        key={`${product.id}-${product.images[0]}-${product.price}`}
        product={product}
        suggestions={suggestions}
      />
    </PublicLayout>
  );
}