import nextConfig from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextConfig,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "supabase/migrations/**",
      "lib/supabase/database.types.ts",
    ],
  },
];

export default config;
