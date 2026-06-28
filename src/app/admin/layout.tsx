// src/app/admin/layout.tsx
// ============================================
// Layout Admin Next.js
// ============================================

'use client';

import React, { useEffect, useMemo, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { DesktopSidebar, BottomTabs } from '@/admin/components';
import { clearAdminSession, getAdminSession } from '@/admin/auth';
import type { AdminScreen } from '@/admin/types';

const SCREEN_MAP: Record<string, AdminScreen> = {
  '/admin': 'home',
  '/admin/produits': 'products',
  '/admin/commandes': 'orders',
  '/admin/clients': 'customers',
  '/admin/hpb': 'hpb',
  '/admin/categories': 'categories',
  '/admin/analytics': 'analytics',
  '/admin/contenu': 'content',
  '/admin/stock': 'stockAlerts',
  '/admin/reglages': 'settings',
  '/admin/qa': 'qa'
};

const PATH_MAP: Record<AdminScreen, string> = {
  home: '/admin',
  products: '/admin/produits',
  orders: '/admin/commandes',
  customers: '/admin/clients',
  hpb: '/admin/hpb',
  categories: '/admin/categories',
  analytics: '/admin/analytics',
  content: '/admin/contenu',
  stockAlerts: '/admin/stock',
  settings: '/admin/reglages',
  qa: '/admin/qa',
  editProduct: '/admin/produits/nouveau',
  orderDetail: '/admin/commandes',
  customerDetail: '/admin/clients',
  newPost: '/admin/contenu/nouveau',
  editPost: '/admin/contenu'
};

function AuthRedirect({ to, message }: { to: string; message: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
        <p className="text-brand-text-muted">{message}</p>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useSyncExternalStore(
    () => () => undefined,
    getAdminSession,
    () => false
  );

  const isLoginPage = pathname === '/admin/login';
  const lowStockCount = 0;

  const currentScreen = useMemo<AdminScreen>(() => {
    if (pathname.startsWith('/admin/produits/')) {
      return 'products';
    }

    return SCREEN_MAP[pathname] || 'home';
  }, [pathname]);

  const handleNavigate = (screen: AdminScreen) => {
    router.push(PATH_MAP[screen] || '/admin');
  };

  const handleLogout = async () => {
    await clearAdminSession();
    router.replace('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <AuthRedirect
        to={`/admin/login?redirect=${encodeURIComponent(pathname)}`}
        message="Redirection vers la connexion admin..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <DesktopSidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
      />

      <main className="lg:ml-64 min-h-screen">
        <div className="lg:hidden sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-brand-gold/20 px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="relative h-8 w-28">
              <Image
                src="/images/LOGOSITE/logo.png"
                alt="HP Collection"
                fill
                sizes="112px"
                className="object-contain"
                priority
              />
            </div>
            <button
              onClick={handleLogout}
              type="button"
              aria-label="Se déconnecter"
              className="p-2 text-red-400 hover:text-red-300 cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <div className="p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      <BottomTabs
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        lowStockCount={lowStockCount}
      />
    </div>
  );
}
