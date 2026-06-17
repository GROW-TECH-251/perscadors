import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/admin/AdminApp.tsx",
    "src/admin/hooks/**",
    "src/admin/screens/**",
    "src/services/contentService.ts",
    "src/services/customerMetaService.ts",
    "src/services/mediaService.ts",
    "src/services/settingsService.ts"
  ]),
]);

export default eslintConfig;