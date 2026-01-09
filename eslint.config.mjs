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
  ]),
  // Custom rules
  {
    rules: {
      // Allow setState in useEffect - common pattern for sync with external systems
      "react-hooks/set-state-in-effect": "off",
      // Allow impure functions in useMemo/render for random values
      "react-hooks/purity": "off",
      // Allow modifying refs/shader uniforms in useFrame (Three.js pattern)
      "react-hooks/immutability": "off",
      // Allow manual memoization patterns
      "react-hooks/preserve-manual-memoization": "off",
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
    },
  },
]);

export default eslintConfig;
