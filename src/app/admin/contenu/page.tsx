// src/app/admin/contenu/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton } from '@/admin/components';
import { FileText } from 'lucide-react';

export default function AdminContentPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Contenu</h1>
        </div>
        <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
      </div>
      <AdminCard>
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-brand-gold" />
          <p className="text-brand-text-muted">Gestion des posts - À implémenter</p>
        </div>
      </AdminCard>
    </div>
  );
}
