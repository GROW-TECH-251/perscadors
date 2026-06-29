# 08. STORAGE POLICIES — POLICES RLS SUPABASE STORAGE

## VERROUILLAGE SÉCURISÉ DES ACCÈS AUX BUCKETS
Pour éviter qu'un utilisateur non autorisé ne puisse uploader ou altérer les fichiers de votre bucket `site-assets`, vous devez configurer les polices de sécurité RLS (Row Level Security) sur Supabase Storage.

### ÉTAPE 1 : ACCÉDER AUX POLICES DE STORAGE
1. Dans le tableau de bord Supabase, cliquez sur l'icône de dossier **"Storage"** dans la barre latérale gauche.
2. Cliquez sur le bucket `site-assets` et sélectionnez l'onglet **"Policies"** dans le menu sous le nom du bucket (ou via l'icône de bouclier dans `Authentication > Policies > storage.objects`).

### ÉTAPE 2 : SCRIPTS SQL DE CRÉATION DES POLICES STORAGE & DB
Vous pouvez également appliquer l'ensemble des règles de sécurité Storage et Database d'un seul coup via l'**Éditeur SQL** de Supabase. Copiez-collez le script officiel ci-dessous et cliquez sur **"Run"** :

```sql
-- ==========================================
-- 1. SÉCURITÉ DE LA TABLE site_assets
-- ==========================================
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;

-- Accès en lecture ouvert à tous pour le site public
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Accès lecture public site_assets' AND tablename = 'site_assets') THEN
        CREATE POLICY "Accès lecture public site_assets" ON public.site_assets
            FOR SELECT USING (true);
    END IF;
END $$;

-- Accès en écriture/suppression réservé aux administrateurs authentifiés
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestion admin site_assets' AND tablename = 'site_assets') THEN
        CREATE POLICY "Gestion admin site_assets" ON public.site_assets
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;


-- ==========================================
-- 2. SÉCURITÉ DU BUCKET STORAGE site-assets
-- ==========================================
-- Rendre les objets du bucket visibles par tout le monde en lecture
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lecture publique site-assets' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Lecture publique site-assets" ON storage.objects
            FOR SELECT USING (bucket_id = 'site-assets');
    END IF;
END $$;

-- Rendre l'upload et la suppression accessibles uniquement aux membres connectés
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gestion admin objets site-assets' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Gestion admin objets site-assets" ON storage.objects
            FOR ALL USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');
    END IF;
END $$;
```

### ÉTAPE 3 : VÉRIFICATION DANS LE TABLEAU DE BORD
1. Allez dans `Storage > site-assets > Policies`.
2. Vérifiez que la règle de **SELECT** est active pour tout le monde (anonyme).
3. Vérifiez que les règles d'**INSERT**, **UPDATE** et **DELETE** portent bien la condition `auth.role() = 'authenticated'`.

---
**La sécurité de vos fichiers est impénétrable.** Passez au fichier `09_DEPLOYMENT.md` pour mettre votre site en ligne sur Vercel.
