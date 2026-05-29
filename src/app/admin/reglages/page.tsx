// src/app/admin/reglages/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton } from '@/admin/components';
import { Settings } from 'lucide-react';
import { clearAdminSession } from '@/admin/auth';

export default function AdminSettingsPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await clearAdminSession();
    router.push('/admin/login');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Réglages</h1>
        </div>
        <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
      </div>
      <AdminCard>
        <div className="flex items-center gap-3 mb-4">
          <Settings size={24} className="text-brand-gold" />
          <p className="text-brand-text-muted mb-4">Paramètres de la boutique - À implémenter</p>
        </div>
        <AdminButton variant="danger" onClick={handleLogout}>Se déconnecter</AdminButton>
      </AdminCard>
    </div>
  );
}
