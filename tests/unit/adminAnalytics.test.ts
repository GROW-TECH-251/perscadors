import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou IMP-10 — Admin analytics polish :
// - export CSV strictement inchangé (libellés au octet près) ;
// - états vides structurés ×3, conditions de rendu conservées ;
// - tooltip premium partagé sur les 3 graphiques + cursor stylé ;
// - 6 KPI animés (useCountUp) coupés sous prefers-reduced-motion ;
// - AUCUN nouveau graphique : imports recharts strictement identiques ;
// - formats monnaie d'origine conservés.
describe('Unit — IMP-10 Admin analytics polish', () => {
  it('export CSV inchangé : fonction et libellés au octet près', async () => {
    const page = await readFile('src/app/admin/analytics/page.tsx', 'utf-8');
    expect(page).toContain('const handleExportCsv = () => {');
    expect(page).toContain('=== METRIQUES FINANCIERES HP COLLECTION (');
    expect(page).toContain('`Revenu Total (Livrées): ${analytics.stats.totalRevenue} FCFA`');
    expect(page).toContain('`MRR (30 derniers jours): ${analytics.stats.mrr} FCFA`');
    expect(page).toContain('`Panier Moyen: ${analytics.stats.averageOrderValue} FCFA`');
    expect(page).toContain('`Commandes Enregistrées: ${analytics.stats.totalOrders}`');
    expect(page).toContain('`Clients Uniques: ${analytics.stats.totalCustomers}`');
    expect(page).toContain('`Taux de Rétention Clients: ${analytics.stats.retentionRate}%`');
    expect(page).toContain('hp-collection-analytics-');
    expect(page).toContain('text/csv;charset=utf-8;');
  });

  it('états vides structurés ×3 avec conditions de rendu conservées', async () => {
    const page = await readFile('src/app/admin/analytics/page.tsx', 'utf-8');
    expect(page).toContain('function ChartEmptyState(');
    expect(page).toContain('title="Aucun revenu enregistré"');
    expect(page).toContain('title="Catalogue vide"');
    expect(page).toContain('title="Aucun client segmenté"');
    expect(page).toContain('analytics.revenueByMonth.length > 0 ?');
    expect(page).toContain('analytics.topProducts.length > 0 ?');
    expect(page).toContain('analytics.customerSegments.length > 0 ?');
    expect(page).not.toContain('text-brand-text-muted italic');
  });

  it('tooltip premium partagé sur les 3 graphiques + cursor stylé', async () => {
    const page = await readFile('src/app/admin/analytics/page.tsx', 'utf-8');
    expect(page.match(/content=\{<ChartTooltip/g)?.length).toBe(3);
    expect(page).toContain("cursor={{ stroke: '#B8952A', strokeOpacity: 0.35 }}");
    expect(page).toContain("cursor={{ fill: 'rgba(184, 149, 42, 0.08)' }}");
    expect(page).toContain('valueFormatter={formatChartCurrency}');
    expect(page).toContain('valueFormatter={(value) => `${value} client(s)`}');
    expect(page).not.toContain('#F5F0E8');
  });

  it('6 KPI animés via useCountUp, coupés sous prefers-reduced-motion', async () => {
    const page = await readFile('src/app/admin/analytics/page.tsx', 'utf-8');
    expect(page).toContain('const KPI_COUNTUP_MS = 800;');
    expect(page).toContain('function useCountUp(target: number): number');
    expect(page).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
    expect(page).toContain('cancelAnimationFrame(rafId)');
    expect(page.match(/<KpiValue /g)?.length).toBe(6);
  });

  it('aucun nouveau graphique : imports recharts strictement identiques', async () => {
    const page = (await readFile('src/app/admin/analytics/page.tsx', 'utf-8')).replace(/\r\n/g, '\n');
    const expected = `import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';`;
    expect(page).toContain(expected);
    for (const banned of ['AreaChart', 'ComposedChart', 'RadarChart', 'RadialBarChart', 'ScatterChart', 'FunnelChart']) {
      expect(page).not.toContain(banned);
    }
  });

  it('formats monnaie d’origine conservés', async () => {
    const page = await readFile('src/app/admin/analytics/page.tsx', 'utf-8');
    expect(page).toContain("const formatCurrency = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;");
    expect(page).toContain('const formatChartCurrency =');
    expect(page).toContain('`${Math.round(Number(value) / 1000)}k`');
  });
});
