// src/App.tsx
// ============================================
// Point d'entrée principal de l'application
// ============================================
// Routes publiques + Routes admin

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WhatsAppFloat } from './components/layout/WhatsAppFloat';
import { CartDrawer } from './components/cart/CartDrawer';
import { Home } from './pages/Home';
import { Categorie } from './pages/Categorie';
import { Produit } from './pages/Produit';
import { Looks } from './pages/Looks';
import { AdminApp } from './admin/AdminApp';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-brand-bg">
          {/* Routes publiques avec Navbar + Footer */}
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <main>
                    <Home />
                  </main>
                  <Footer />
                  <WhatsAppFloat />
                  <CartDrawer />
                </>
              }
            />
            <Route
              path="/categorie/:slug"
              element={
                <>
                  <Navbar />
                  <main>
                    <Categorie />
                  </main>
                  <Footer />
                  <WhatsAppFloat />
                  <CartDrawer />
                </>
              }
            />
            <Route
              path="/produit/:id"
              element={
                <>
                  <Navbar />
                  <main>
                    <Produit />
                  </main>
                  <Footer />
                  <WhatsAppFloat />
                  <CartDrawer />
                </>
              }
            />
            <Route
              path="/looks"
              element={
                <>
                  <Navbar />
                  <main>
                    <Looks />
                  </main>
                  <Footer />
                  <WhatsAppFloat />
                  <CartDrawer />
                </>
              }
            />

            {/* Route Admin (sans Navbar/Footer publics) */}
            <Route path="/admin/*" element={<AdminApp />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;