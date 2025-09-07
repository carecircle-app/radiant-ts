// eslint.config.mjs
// Flat-config for ESLint 9 + Next.js

import next from 'eslint-config-next';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Next.js recommended config
  ...next,

  // Add ignores here (no second export!)
  {
    ignores: [
      'src/lib/mailer.ts',
      'src/lib/slack.ts',
      'src/lib/webhookStore.ts',
    ],
  },
];
