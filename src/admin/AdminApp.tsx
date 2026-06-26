// src/admin/AdminApp.tsx
// ============================================
// Application Admin Principale
// ============================================
// Assemble tous les écrans admin, gère navigation et auth

import React, { useState, useEffect, useCallback } from 'react';
import { DesktopSidebar, BottomTabs } from './components';
import { getAdminSession, clearAdminSession } from './auth';
import { AdminLogin } from './screens/AdminLogin';
import { DashboardHome } from './screens/DashboardHome';
import { ProductsScreen } from './screens/ProductsScreen';
import { EditProductScreen } from './screens/EditProductScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { CustomersScreen } from './screens/CustomersScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { StockAlertsScreen } from './screens/StockAlertsScreen';
import { QaChecklistScreen } from './screens/QaChecklistScreen';
import { ContentPostsScreen } from './screens/ContentPostsScreen';
import type { AdminScreen } from './types';
import type { AdminProduct } from '@/admin/types';

export const AdminApp: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<AdminScreen>('home');
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [lowStockCount, setLowStockCount] = useState(0);

  // CORRECTION: checkSession avec useCallback et encapsulation dans useEffect
  const checkSession = useCallback(() => {
    const isAuthenticated = getAdminSession();
    setLoggedIn(isAuthenticated);
    setLoading(false);
  }, []);

  // CORRECTION: Encapsulation dans une fonction async interne
  useEffect(() => {
    const init = async () => {
      await checkSession();
    };
    init();
  }, [checkSession]);

  // Gérer la connexion réussie
  const handleLoginSuccess = () => {
    setLoggedIn(true);
    setCurrentScreen('home');
  };

  // Gérer la déconnexion
  const handleLogout = async () => {
    await clearAdminSession();
    setLoggedIn(false);
    setCurrentScreen('home');
  };

  // CORRECTION: Typage explicite AdminScreen pour onNavigate
  const handleNavigate = (screen: AdminScreen) => {
    setCurrentScreen(screen);
  };

  // Éditer un produit
  const handleEditProduct = (product: AdminProduct) => {
    setSelectedProduct(product || null);
    setCurrentScreen('editProduct');
  };

  // Après sauvegarde produit
  const handleProductSaved = () => {
    setSelectedProduct(null);
    setCurrentScreen('products');
  };

  // Annuler édition produit
  const handleEditCancel = () => {
    setSelectedProduct(null);
    setCurrentScreen('products');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement de l&apos;admin...</p>
        </div>
      </div>
    );
  }

  // Non connecté → Afficher login
  if (!loggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Connecté → Afficher l&apos;admin
  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
      />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Bar (Mobile only) */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#0A0A0A] border-b border-brand-gold/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <img
              src="/images/LOGOSITE/logo.png"
              alt="HP Collection"
              className="h-8 object-contain"
            />
            <button
              onClick={handleLogout}
              className="p-2 text-red-400 hover:text-red-300 cursor-pointer"
              aria-label="Se déconnecter"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Screen Content */}
        <div className="p-6 lg:p-8 pb-24 lg:pb-8">
          {/* Home / Dashboard */}
          {currentScreen === 'home' && (
            <DashboardHome
              onNavigate={handleNavigate}
              onEditProduct={handleEditProduct}
            />
          )}

          {/* Products */}
          {currentScreen === 'products' && (
            <ProductsScreen
              onEdit={handleEditProduct}
              onBack={() => handleNavigate('home')}
            />
          )}

          {/* Edit Product */}
          {currentScreen === 'editProduct' && (
            <EditProductScreen
              product={selectedProduct}
              onSave={handleProductSaved}
              onCancel={handleEditCancel}
            />
          )}

          {/* Orders */}
          {currentScreen === 'orders' && (
            <OrdersScreen
              onBack={() => handleNavigate('home')}
            />
          )}

          {/* Customers */}
          {currentScreen === 'customers' && (
            <CustomersScreen
              onBack={() => handleNavigate('home')}
            />
          )}

          {/* Categories */}
          {currentScreen === 'categories' && (
            <CategoriesScreen
              onBack={() => handleNavigate('settings')}
            />
          )}

          {/* Analytics */}
          {currentScreen === 'analytics' && (
            <AnalyticsScreen
              onBack={() => handleNavigate('home')}
            />
          )}

          {/* Content / Posts */}
          {currentScreen === 'content' && (
            <ContentPostsScreen
              onBack={() => handleNavigate('home')}
            />
          )}

          {/* Stock Alerts */}
          {currentScreen === 'stockAlerts' && (
            <StockAlertsScreen
              onBack={() => handleNavigate('home')}
              onEditProduct={handleEditProduct}
            />
          )}

          {/* Settings */}
          {currentScreen === 'settings' && (
            <SettingsScreen
              onBack={() => handleNavigate('home')}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          )}

          {/* QA Checklist */}
          {currentScreen === 'qa' && (
            <QaChecklistScreen
              onBack={() => handleNavigate('settings')}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Tabs */}
      <BottomTabs
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        lowStockCount={lowStockCount}
      />
    </div>
  );
};

export default AdminApp;