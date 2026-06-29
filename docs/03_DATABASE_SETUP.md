# 03. DATABASE SETUP — ARCHITECTURE DE LA BASE DE DONNÉES

## TABLES ET SCHÉMAS POUR LE SYSTÈME DE MÉDIAS DYNAMIQUES
Ce document fournit les scripts SQL officiels à exécuter dans votre instance Supabase pour créer l'architecture de données requise par le **Universal Admin Dynamic Media System**.

### ÉTAPE 1 : ACCÉDER À L'ÉDITEUR SQL
1. Dans le tableau de bord Supabase, cliquez sur l'icône de terminal **"SQL Editor"** dans la barre latérale gauche.
2. Cliquez sur le bouton **"New Query"** (Nouvelle requête).

### ÉTAPE 2 : SCRIPT SQL D'INITIALISATION DE LA TABLE `site_assets`
Copiez-collez le script complet ci-dessous et cliquez sur le bouton vert **"Run"** (Exécuter) en bas à droite :

```sql
-- ==========================================
-- TABLE: site_assets (Universal Media System)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.site_assets (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    section TEXT NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT,
    alt TEXT NOT NULL DEFAULT 'HP Collection Media',
    title TEXT NOT NULL DEFAULT 'Média Boutique',
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    order_index INT NOT NULL DEFAULT 1,
    is_social_url BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEX ET PERFORMANCES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_site_assets_section_active ON public.site_assets(section, active);
CREATE INDEX IF NOT EXISTS idx_site_assets_order ON public.site_assets(order_index);

-- ==========================================
-- TRIGGER DE MISE À JOUR AUTOMATIQUE
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_site_assets_modtime ON public.site_assets;
CREATE TRIGGER update_site_assets_modtime
BEFORE UPDATE ON public.site_assets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### ÉTAPE 3 : AUTRES TABLES DE L'ÉCOSYSTÈME PERSCADORS (Rappel)
Si votre base de données est entièrement vierge, exécutez également ce bloc pour garantir la présence des tables du catalogue et du module HPB :

```sql
CREATE TABLE IF NOT EXISTS public.products (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INT NOT NULL,
    image_url TEXT,
    images TEXT[] DEFAULT '{}',
    sizes TEXT[] DEFAULT '{}',
    colors TEXT[] DEFAULT '{}',
    demand INT DEFAULT 0,
    stock INT DEFAULT 0,
    badge TEXT,
    description TEXT,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outfits (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    custom_price INT,
    product_ids INT[] DEFAULT '{}',
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ÉTAPE 4 : VÉRIFICATION DANS LE TABLEAU DE BORD
1. Cliquez sur l'icône de table **"Table Editor"** dans la barre latérale gauche.
2. Vérifiez que la table `site_assets` apparaît correctement avec ses 13 colonnes configurées.

---
**Votre schéma de base de données est déployé.** Passez au fichier `04_AUTH_SETUP.md` pour sécuriser l'accès de Vioutou.
