// eslint.config.mjs
import next from 'eslint-config-next';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Next.js recommended config
  ...next,

  // Custom ignores
  {
    ignores: [
      'src/lib/mailer.ts',
      'src/lib/slack.ts',
      'src/lib/webhookStore.ts',
    ],
  },
];
