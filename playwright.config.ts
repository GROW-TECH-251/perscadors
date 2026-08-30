import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // FIX E2E IMP-12 : workers séquentiels — la home embarque une vidéo 4K
  // (36 Mo, autoplay) ; en fullyParallel, 4 onglets Chromium décodant
  // simultanément la vidéo saturent la mémoire (Page crashed observé).
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chromium Pixel 5',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // FIX E2E IMP-12 : E2E exécutés contre le build de production. Le dev server
  // (Turbopack) compile la home à froid lors des premiers tests -> dépassement
  // du timeout par défaut (30 s) sans que le code soit en cause. Un serveur
  // déjà lancé sur :3000 est réutilisé tel quel (npm run start par ex.).
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
