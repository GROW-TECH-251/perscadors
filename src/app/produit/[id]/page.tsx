'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductById, products } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { Size } from '@/types';
import { ArrowLeft, MessageSquareCode, ShoppingBag } from 'lucide-react';

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const product = getProductById(id);

  const { addToCart } = useCart();

  const [selectedImage, setSelectedImage] = useState<string>(product?.images[0] ?? '');
  const [selectedSize, setSelectedSize] = useState<Size | null>(
    product?.sizes.find((size) => !product.outOfStockSizes?.includes(size)) || product?.sizes[0] || null
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product?.colors.find((color) => !product.outOfStockColors?.includes(color)) || product?.colors[0] || ''
  );
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-6">
        <span className="text-4xl">⚠️</span>
        <h1 className="font-bebas text-4xl text-brand-text">Article introuvable</h1>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-brand-gold text-brand-bg font-bebas text-lg uppercase tracking-wider rounded"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const suggestions = products
    .filter((currentProduct) => currentProduct.id !== product.id && (currentProduct.category === product.category || currentProduct.isPopular))
    .slice(0, 4);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link
          href={`/categorie/${product.category}`}
          className="flex items-center gap-2 text-brand-text-muted hover:text-brand-gold transition-colors font-bebas text-lg uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Retour à la catégorie
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">
        <div className="lg:col-span-6 space-y-4">
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl border border-brand-gold/15 bg-brand-bg-alt shadow-lg">
            {selectedImage && (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                priority
                className="object-cover"
              />
            )}

            {!product.inStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-red-600 text-white font-bebas text-3xl uppercase tracking-widest px-6 py-3 rounded transform -rotate-12">
                  Rupture de Stock
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto py-1">
            {product.images.map((image, index) => (
              <button
                key={image}
                onClick={() => setSelectedImage(image)}
                className={`relative w-20 sm:w-24 aspect-[3/4] flex-shrink-0 overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
                  selectedImage === image ? 'border-brand-gold shadow' : 'border-transparent hover:border-brand-gold/40'
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} angle ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 p-6 sm:p-8 bg-brand-bg-alt border border-brand-gold/15 rounded-2xl shadow-xl space-y-8">
          <div>
            <span className="text-xs text-brand-gold tracking-widest uppercase font-semibold block mb-2">
              {product.category.replace(/-/g, ' ')}
            </span>
            <h1 className="font-bebas text-4xl sm:text-5xl text-brand-text tracking-wider uppercase leading-none mb-3">
              {product.name}
            </h1>
            <div className="text-2xl font-bold text-brand-gold">
              {product.price.toLocaleString()} FCFA
            </div>
          </div>

          <p className="text-sm sm:text-base text-brand-text-muted leading-relaxed">
            {product.description}
          </p>

          <div className="space-y-3">
            <h3 className="font-bebas text-lg tracking-wider text-brand-text-muted uppercase">Sélectionner la Taille</h3>
            <div className="flex flex-wrap gap-3">
              {product.sizes.map((size) => {
                const isOutOfStock = product.outOfStockSizes?.includes(size);
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 font-bebas text-md tracking-wider rounded border transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'border-gray-300 text-gray-400 bg-gray-100/50 line-through cursor-not-allowed opacity-40'
                        : isSelected
                          ? 'bg-brand-gold border-brand-gold text-brand-bg shadow-md'
                          : 'border-brand-gold/20 hover:border-brand-gold text-brand-text bg-brand-bg'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bebas text-lg tracking-wider text-brand-text-muted uppercase">Sélectionner la Couleur</h3>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((color) => {
                const isOutOfStock = product.outOfStockColors?.includes(color);
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 font-bebas text-md tracking-wider rounded-full border transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'border-gray-300 text-gray-400 bg-gray-100/50 line-through cursor-not-allowed opacity-40'
                        : isSelected
                          ? 'bg-brand-gold border-brand-gold text-brand-bg shadow-md'
                          : 'border-brand-gold/20 hover:border-brand-gold text-brand-text bg-brand-bg'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <p className="text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              ⚠️ {errorMsg}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-gold/10">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full py-4 font-bebas text-xl uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                product.inStock
                  ? 'border-brand-gold hover:bg-brand-gold hover:text-brand-bg text-brand-gold bg-transparent'
                  : 'border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag size={18} />
              Ajouter au panier
            </button>

            <button
              onClick={handleDealWhatsApp}
              className="w-full py-4 bg-brand-gold hover:bg-brand-gold-light text-brand-bg font-bebas text-xl uppercase tracking-widest rounded transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquareCode size={18} />
              Deal avec Vioutou
            </button>
          </div>
        </div>
      </div>

      <section className="border-t border-brand-gold/15 pt-20">
        <div className="mb-12">
          <h2 className="font-bebas text-4xl tracking-wider text-brand-gold uppercase">Complète le look</h2>
          <div className="w-16 h-1 bg-brand-gold mt-2" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion.id}
              href={`/produit/${suggestion.id}`}
              className="group bg-brand-bg-alt border border-brand-gold/10 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
            >
              <div className="relative w-full aspect-[3/4] overflow-hidden bg-brand-bg">
                <Image
                  src={suggestion.images[0]}
                  alt={suggestion.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {!suggestion.inStock && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-red-600 text-white font-bebas text-md uppercase tracking-wider px-2 py-1 rounded">
                      Rupture
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 flex-grow flex flex-col justify-between gap-2">
                <h3 className="font-bebas text-lg text-brand-text tracking-wide uppercase line-clamp-1 leading-tight group-hover:text-brand-gold transition-colors">
                  {suggestion.name}
                </h3>
                <span className="font-bold text-sm text-brand-gold">
                  {suggestion.price.toLocaleString()} FCFA
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}