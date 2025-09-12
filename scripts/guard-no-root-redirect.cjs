/* node scripts/guard-no-root-redirect.cjs (v2) */
const fs = require("fs");
const path = require("path");

// Only flag redirects *outside* the Stripe checkout route handler
const roots = ["src/app","app","src/pages","pages","src"];
const bad = /(NextResponse\.redirect|permanentRedirect|\bredirect\(|res\.writeHead\s*\(\s*30\d)/i;

// Whitelist your Stripe route that *must* redirect to Stripe:
const WHITELIST = new Set([
  path.normalize("src/app/api/stripe/checkout/route.ts"),
]);

let hits = [];
function scan(p) {
  if (!fs.existsSync(p)) return;
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const f of fs.readdirSync(p)) scan(path.join(p, f));
  } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(p)) {
    const rel = path.normalize(p);
    if (WHITELIST.has(rel)) return; // allow this file
    const txt = fs.readFileSync(p, "utf8");
    if (bad.test(txt)) hits.push(rel);
  }
}
roots.forEach(scan);

if (hits.length) {
  console.error("\n Found redirect-like code that could reintroduce 307 (outside Stripe checkout):");
  for (const h of hits) console.error(" - " + h);
  console.error("\nRemove/disable these before building or deploying.\n");
  process.exit(2);
} else {
  console.log(" guard-no-root-redirect: no risky redirects found (Stripe checkout allowed).");
}
