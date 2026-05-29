// src/app/admin/qa/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton } from '@/admin/components';
import { CheckSquare } from 'lucide-react';

export default function AdminQaPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Checklist QA</h1>
        </div>
        <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
      </div>
      <AdminCard>
        <div className="flex items-center gap-3">
          <CheckSquare size={24} className="text-brand-gold" />
          <p className="text-brand-text-muted">Checklist qualité - À implémenter</p>
        </div>
      </AdminCard>
    </div>
  );
}
