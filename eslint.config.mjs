import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  // Next.js-Regeln inkl. Core Web Vitals
  ...nextVitals,

  // projektspezifische Regel
  {
    rules: {
      "import/no-anonymous-default-export": [
        "error",
        {
          allowObject: true,
        },
      ],
    },
  },

  // generierte Dateien + build-Ausgaben nicht linten
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
