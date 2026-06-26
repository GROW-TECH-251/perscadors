// src/app/admin/login/page.tsx
// ============================================
// Login Admin Next.js
// ============================================

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInAdmin, setAdminSession } from '@/admin/auth';
import { AdminInput, AdminButton } from '@/admin/components';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signInAdmin(identifier, password);

      if (result.ok) {
        setAdminSession();
        router.push('/admin');
      } else {
        setError(result.message);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/images/LOGOSITE/logo.png"
            alt="HP Collection"
            className="w-48 h-16 object-contain mx-auto mb-4"
          />
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
            Administration
          </h1>
          <p className="text-brand-text-muted mt-2">
            Connectez-vous pour gérer votre boutique
          </p>
        </div>

        <div className="bg-brand-bg-alt border border-brand-gold/15 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <AdminInput
              label="Identifiant"
              value={identifier}
              onChange={setIdentifier}
              type="email"
              placeholder="admin@perscadors.com"
              required
              disabled={loading}
            />

            <AdminInput
              label="Mot de passe"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              required
              disabled={loading}
            />

            <AdminButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  Se connecter
                </>
              )}
            </AdminButton>
          </form>

          <div className="mt-6 text-center text-xs text-brand-text-muted">
            <p>
              Identifiant : <code className="text-brand-gold">admin@perscadors.com</code>
            </p>
            <p>
              Mot de passe : <code className="text-brand-gold">perscadors2024</code>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-brand-text-muted hover:text-brand-gold text-sm transition-colors"
          >
            ← Retour à la boutique
          </Link>
        </div>
      </div>
    </div>
  );
}