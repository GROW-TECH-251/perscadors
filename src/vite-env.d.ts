// src/vite-env.d.ts
// ============================================
// Déclarations de types pour Vite
// ============================================
// Ce fichier permet à TypeScript de reconnaître import.meta.env

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_WHATSAPP_PHONE_DIGITS: string
  readonly VITE_WHATSAPP_PHONE_DISPLAY: string
  readonly VITE_ADMIN_LOGIN_ID: string
  readonly VITE_ADMIN_PASSWORD: string
  readonly VITE_GA_MEASUREMENT_ID: string
  readonly VITE_SHOP_NAME: string
  readonly VITE_SHOP_CURRENCY: string
  readonly VITE_SHOP_COUNTRY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}