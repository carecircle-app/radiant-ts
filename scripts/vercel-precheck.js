const fs = require('fs');
const path = require('path');
const has = p => (fs.existsSync(p) ? 'YES' : 'NO');
const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return '(missing)'; } };

console.log('=== PREBUILD CHECK ===');
console.log('CWD                 :', process.cwd());
console.log('Has package.json    :', has('package.json'));
console.log('Has next.config.js  :', has('next.config.js'));
console.log('Has next.config.mjs :', has('next.config.mjs'));
console.log('Has eslint.config.mjs:', has('eslint.config.mjs'));
try {
  const pkg = require(path.resolve('package.json'));
  console.log('Build script        :', (pkg.scripts && pkg.scripts.build) || '(none)');
  console.log('Prebuild script     :', (pkg.scripts && pkg.scripts.prebuild) || '(none)');
} catch { console.log('Build/Prebuild      : (cannot read package.json)'); }

if (fs.existsSync('next.config.js')) {
  const lines = read('next.config.js').split(/\r?\n/).slice(0,50).join('\n');
  console.log('\\n--- next.config.js (first 50 lines) ---\\n' + lines + '\\n--- end ---');
}

console.log('\\nRoot files:', fs.readdirSync('.').sort().join(', '));
console.log('======================');
