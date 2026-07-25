'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, UserRound, MessageCircle } from 'lucide-react';
import { AdminButton, AdminModal } from '@/admin/components';
import { normalizePhoneForWhatsApp } from '@/services/whatsappService';
import { fetchCustomerSummaries } from '@/services/customerService';
import type { CustomerSummary } from '@/admin/types';

interface WhatsAppRecipientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: CustomerSummary) => void;
  title?: string;
}

export function WhatsAppRecipientDialog({ isOpen, onClose, onSelect, title = 'Envoyer à un client' }: WhatsAppRecipientDialogProps) {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [externalName, setExternalName] = useState('');
  const [externalPhone, setExternalPhone] = useState('');
  const [externalError, setExternalError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetchCustomerSummaries().then(setCustomers).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr-FR');
    if (!normalized) return customers.slice(0, 8);
    return customers.filter((customer) =>
      customer.name.toLocaleLowerCase('fr-FR').includes(normalized) ||
      customer.phone.includes(query)
    ).slice(0, 12);
  }, [customers, query]);

  const selectExternalRecipient = () => {
    const phone = normalizePhoneForWhatsApp(externalPhone);
    if (phone.length < 8) { setExternalError('Saisissez un numéro WhatsApp valide.'); return; }
    onSelect({ phone, name: externalName.trim() || 'Client WhatsApp', area: '', orderCount: 0, totalSpent: 0, lastOrderDate: new Date().toISOString(), lastOrderStatus: 'EN ATTENTE', preferredSizes: [], preferredColors: [], segments: [], notes: '', tags: [] });
    onClose();
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-brand-text-muted">Choisissez le client qui recevra le message WhatsApp préparé par Perscadors.</p>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un nom ou téléphone..." className="w-full rounded-xl border border-brand-gold/20 bg-brand-bg py-3 pl-10 pr-4 text-brand-text" />
        </div>
        <div className="rounded-xl border border-brand-gold/15 bg-brand-bg p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Nouveau contact WhatsApp</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input value={externalName} onChange={(event) => setExternalName(event.target.value)} placeholder="Nom (optionnel)" className="rounded-lg border border-brand-gold/15 bg-brand-bg-alt px-3 py-2 text-sm text-brand-text" /><input value={externalPhone} onChange={(event) => { setExternalPhone(event.target.value); setExternalError(''); }} placeholder="Numéro WhatsApp" className="rounded-lg border border-brand-gold/15 bg-brand-bg-alt px-3 py-2 text-sm text-brand-text" /></div>
          {externalError && <p className="text-xs text-red-500">{externalError}</p>}
          <AdminButton type="button" variant="primary" size="sm" onClick={selectExternalRecipient}>Envoyer à ce numéro</AdminButton>
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {loading && <p className="p-4 text-sm text-brand-text-muted">Chargement des clients…</p>}
          {!loading && results.length === 0 && <p className="p-4 text-sm text-brand-text-muted">Aucun client trouvé.</p>}
          {results.map((customer) => (
            <button key={customer.phone} type="button" onClick={() => { onSelect(customer); onClose(); }} className="flex w-full items-center justify-between rounded-xl border border-brand-gold/10 bg-brand-bg p-3 text-left transition-colors hover:border-brand-gold hover:bg-brand-gold/5">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold"><UserRound size={18} /></span><div><p className="font-medium text-brand-text">{customer.name}</p><p className="text-xs text-brand-text-muted">{customer.phone} · {customer.totalSpent.toLocaleString()} FCFA</p></div></div>
              <MessageCircle size={18} className="text-[#25D366]" />
            </button>
          ))}
        </div>
        <AdminButton type="button" variant="secondary" className="w-full" onClick={onClose}>Annuler</AdminButton>
      </div>
    </AdminModal>
  );
}
