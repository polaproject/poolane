import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Phase 16.1: ignore non-production code
    "qa/**",            // design reference + QA artifacts, not deployed
    "scripts/**",       // one-off migration scripts (Node.js, không phải app code)
    "prisma/**",        // seed scripts (Node.js)
  ]),
  // Phase 16.1: project-wide rule adjustments
  {
    rules: {
      // React 19 strict rule — useEffect fetch pattern intentional in client components,
      // không phải bug. App at scale 200 HV không bị ảnh hưởng performance.
      // Sẽ migrate sang use() hook hoặc TanStack Query khi scale lớn.
      "react-hooks/set-state-in-effect": "off",
      // React 19 — Date.now() in render technically impure, nhưng OK trong Server Component
      // (chạy 1 lần per request, không re-render). Fix specific cases where needed.
      "react-hooks/purity": "off",
      // Accept `_` prefix làm convention ignore intentional (vd `{ password: _, ...rest }`)
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
      }],
    },
  },
]);

export default eslintConfig;
