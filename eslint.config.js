// eslint.config.js (flat config for ESLint v9)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  // 1) Global ignores
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'vbank/**',
      'dist/**',
      'out/**',
      // keep backup files ignored just in case
      '**/*.backup-*.ts',
      '**/*.backup-*.tsx',
    ],
  },

  // 2) Base JS + TS recommended
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3) Rules that apply to your code files
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      // keep these relaxed for now
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
];
