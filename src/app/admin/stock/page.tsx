// src/app/admin/stock/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton } from '@/admin/components';
import { AlertTriangle } from 'lucide-react';

export default function AdminStockPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Alertes Stock</h1>
        </div>
        <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
      </div>
      <AdminCard>
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} className="text-yellow-500" />
          <p className="text-brand-text-muted">Alertes de stock faible - À implémenter</p>
        </div>
      </AdminCard>
    </div>
  );
}
