# 11. ANALYTICS SYSTEM — PROCÉDURES STOCKÉES RPC SUPABASE

## MOTEUR D'AGRÉGATION EN TEMPS RÉEL (Procédure Stockée PostgreSQL)
Pour que la page `/admin/analytics` puisse extraire directement les métriques financières avancées depuis le cluster de base de données (au lieu de reposer uniquement sur la fusion en mémoire), vous devez déployer les fonctions RPC (Remote Procedure Call) dans Supabase.

### ÉTAPE 1 : ACCÉDER À L'ÉDITEUR SQL SUPABASE
1. Connectez-vous au tableau de bord Supabase > **"SQL Editor"**.
2. Cliquez sur **"New Query"**.

### ÉTAPE 2 : SCRIPT SQL D'INITIALISATION DES FONCTIONS RPC
Copiez-collez le script complet ci-dessous et cliquez sur le bouton vert **"Run"** :

```sql
-- ==========================================
-- 1. RPC: get_monthly_revenue
-- Évolution du chiffre d'affaires des commandes LIVRÉES sur les 6 derniers mois
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_monthly_revenue()
RETURNS TABLE(month TEXT, revenue INT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(created_at, 'MM/YYYY') AS month,
        COALESCE(SUM(total)::INT, 0) AS revenue
    FROM public.orders
    WHERE status = 'LIVRÉE' 
      AND created_at >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(created_at, 'MM/YYYY'), DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. RPC: get_top_viewed_products
-- Top 5 des produits les plus demandés
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_top_viewed_products()
RETURNS TABLE(name TEXT, price INT, demand INT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name, 
        p.price, 
        COALESCE(p.demand, 0) AS demand
    FROM public.products p
    WHERE p.visible = true
    ORDER BY p.demand DESC NULLS LAST
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. RPC: get_order_status_counts
-- Répartition logistique globale des commandes
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_order_status_counts()
RETURNS TABLE(name TEXT, value INT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        status AS name,
        COUNT(*)::INT AS value
    FROM public.orders
    GROUP BY status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### ÉTAPE 3 : VÉRIFICATION DU REPLI HYBRIDE (Fallback)
Grâce à l'architecture avancée de `src/services/analyticsService.ts`, si vous décidez de ne pas exécuter ce script SQL (ou si un incident survient sur l'API Supabase), l'application ne plantera **jamais**. Elle exécutera instantanément l'algorithme d'agrégation hybride local pour fournir les mêmes graphiques avec la même précision !

---
**Votre moteur de rentabilité est pleinement paramétré.**
