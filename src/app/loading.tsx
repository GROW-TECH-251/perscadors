// src/app/loading.tsx
// Skeleton global pour perception performance immédiate (<100ms feedback)
// Affiche un écran de chargement premium pendant le changement de route App Router

export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      {/* Navbar skeleton */}
      <div className="h-20 bg-brand-bg-alt border-b border-brand-gold/10 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="w-36 h-12 bg-brand-gold/10 rounded-xl" />
          <div className="hidden md:flex gap-8">
            <div className="w-20 h-6 bg-brand-gold/10 rounded-full" />
            <div className="w-20 h-6 bg-brand-gold/10 rounded-full" />
            <div className="w-20 h-6 bg-brand-gold/10 rounded-full" />
          </div>
          <div className="w-10 h-10 bg-brand-gold/10 rounded-full" />
        </div>
      </div>

      {/* Hero skeleton — hauteur alignée sur le Hero réel (.perscadors-hero) */}
      <div className="perscadors-hero relative w-full bg-black flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-black/30 to-black/35" />
        <div className="relative z-20 max-w-5xl mx-auto text-center px-4 space-y-8">
          <div className="space-y-4">
            <div className="w-96 h-20 bg-white/10 rounded-xl mx-auto animate-pulse" />
            <div className="w-2/3 h-6 bg-white/5 rounded-full mx-auto animate-pulse" />
          </div>
          <div className="flex gap-4 justify-center pt-4">
            <div className="w-48 h-14 bg-brand-gold/20 rounded-xl animate-pulse" />
            <div className="w-48 h-14 bg-white/10 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* CategoryGrid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-brand-bg-alt border border-brand-gold/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
