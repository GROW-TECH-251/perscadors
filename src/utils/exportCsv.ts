// src/utils/exportCsv.ts
// ============================================
// Utilitaires d'export CSV
// ============================================

import type { AdminProduct, AdminOrder, CustomerSummary } from '@/admin/types';

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function downloadCsv(content: string, filename: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportProductsToCsv(products: AdminProduct[]): void {
  const headers = ['ID', 'Nom', 'Catégorie', 'Prix', 'Stock', 'Image', 'Badge', 'Visible', 'Description'];
  
  const rows = products.map(p => [
    p.id,
    p.name,
    p.category,
    p.price,
    p.stock,
    p.image_url || '',
    p.badge || '',
    p.visible ? 'Oui' : 'Non',
    p.description || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\n');

  downloadCsv(csv, `perscadors-produits-${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportOrdersToCsv(orders: AdminOrder[]): void {
  const headers = ['Référence', 'Statut', 'Client', 'Téléphone', 'Zone', 'Total', 'Date', 'Articles'];
  
  const rows = orders.map(o => [
    o.order_number,
    o.status,
    o.client_name,
    o.client_phone,
    o.client_area,
    o.total,
    new Date(o.created_at).toLocaleDateString('fr-FR'),
    o.items.map(i => `${i.name} (x${i.quantity})`).join('; ')
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\n');

  downloadCsv(csv, `perscadors-commandes-${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportCustomersToCsv(customers: CustomerSummary[]): void {
  const headers = ['Nom', 'Téléphone', 'Zone', 'Commandes', 'Total Dépensé', 'Dernière Commande', 'Segments', 'Tags'];
  
  const rows = customers.map(c => [
    c.name,
    c.phone,
    c.area,
    c.orderCount,
    c.totalSpent,
    new Date(c.lastOrderDate).toLocaleDateString('fr-FR'),
    c.segments.join('; '),
    (c.tags || []).join('; ')
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\n');

  downloadCsv(csv, `perscadors-clients-${new Date().toISOString().split('T')[0]}.csv`);
}