// src/app/admin/layout.tsx
// ============================================
// Layout Admin Next.js
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DesktopSidebar, BottomTabs } from '@/admin/components';
import { clearAdminSession } from '@/admin/auth';
import type { AdminScreen } from '@/admin/types';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentScreen, setCurrentScreen] = useState<AdminScreen>('home');
  const [lowStockCount] = useState(0);

  const isLoginPage = pathname === '/admin/login';

  // CORRECTION: Encapsuler setState dans une fonction async
  useEffect(() => {
    const updateScreen = async () => {
      const screenMap: Record<string, AdminScreen> = {
        '/admin': 'home',
        '/admin/produits': 'products',
        '/admin/commandes': 'orders',
        '/admin/clients': 'customers',
        '/admin/categories': 'categories',
        '/admin/analytics': 'analytics',
        '/admin/contenu': 'content',
        '/admin/stock': 'stockAlerts',
        '/admin/reglages': 'settings',
        '/admin/qa': 'qa'
      };

      const screen = screenMap[pathname] || 'home';
      setCurrentScreen(screen);
    };
    updateScreen();
  }, [pathname]);

  const handleNavigate = (screen: AdminScreen) => {
    const pathMap: Record<AdminScreen, string> = {
      home: '/admin',
      products: '/admin/produits',
      orders: '/admin/commandes',
      customers: '/admin/clients',
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

    window.location.href = pathMap[screen] || '/admin';
  };

  const handleLogout = async () => {
    await clearAdminSession();
    window.location.href = '/admin/login';
  };

  if (isLoginPage) {
    return <>{children}</>;
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
        <div className="lg:hidden sticky top-0 z-30 bg-[#0A0A0A] border-b border-brand-gold/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <img
              src="/images/LOGOSITE/logo.png"
              alt="HP Collection"
              className="h-8 object-contain"
            />
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