/* eslint-disable */
// Flat config for ESLint v9+
import tseslint from "typescript-eslint";
import js from "@eslint/js";

export default [
  // 0) Ignore stuff we dont want to lint
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "vbank/**",
      "backups/**",
      "app.off/**",
      "app.off/**",
      "radiant-ts/**",
      "**/*.off.ts",
      "**/*.off.tsx",
      "eslint.config.js",
      "eslint.config.mjs",
    ],
  },

  // 1) Base JS rules
  js.configs.recommended,

  // 2) TypeScript (no project required -> avoids 'file not in project' parser errors)
  ...tseslint.configs.recommended,

  // 3) Globals and a few tweaks
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // browser
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        // node
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        // react (silence 'React is not defined' in files that reference it)
        React: "readonly",
      },
    },
    rules: {
      "no-undef": "off", // many framework-provided globals; we manage via 'globals' above
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
];
