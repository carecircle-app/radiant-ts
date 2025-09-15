import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";

const ROOT = process.cwd();
const exts = "{ts,tsx,js,jsx,md,mdx,json,css,scss,sass,html,svg,txt,csv}";
const IGNORE = ["**/node_modules/**","**/.next/**","**/.git/**","**/*.encodingfix.*.bak"];

const files = await fg([`**/*.${exts}`.replace("{","").replace("}","")], { // fallback, not used
  ignore: IGNORE
});
const all = await fg([`**/*.${exts}`], { dot: true, ignore: IGNORE });

const badMojibake = /(?:Â |Â|Â|Â|â|â|â|âœ|â\x9D|â|â|â|â|Ãââ|ÃâÅ|ÃâÂ|Ãââœ|Ãââ|ÃâžÂ|ÃƒâšÃÂ)/;

const offenders = {
  mojibake: [],
  jsxArrows: [],
  prices: [],
  backHome: [],
};

function rel(p){ return path.relative(ROOT, p).replaceAll("\\","/"); }

for (const f of all) {
  const p = path.resolve(ROOT, f);
  const text = await fs.readFile(p, "utf8");

  // 1) Mojibake
  if (badMojibake.test(text)) offenders.mojibake.push(rel(p));

  // 2) JSX text with raw '->' (escape as -&gt; or use &rarr;)
  if (/\.(tsx|jsx)$/.test(p)) {
    // Heuristic: tags likely containing text nodes
    const bad = /(</?(?:p|li|span|div|h[1-6]|button|a)\b[^>]*>[^<{]*->[^<{]*)/;
    if (bad.test(text)) offenders.jsxArrows.push(rel(p));
  }

  // 3) Hard-coded prices ($4.99/$9.99) anywhere except src/lib/prices.ts
  if (!p.endsWith("src/lib/prices.ts") && /(?:\$(?:4\.99|9\.99))/.test(text)) {
    offenders.prices.push(rel(p));
  }
}

// 4) Back home link required on success/invoice pages
const backTargets = await fg(["src/app/**/success/**/page.tsx","src/app/**/invoice/**/page.tsx"], { ignore: IGNORE });
for (const f of backTargets) {
  const p = path.resolve(ROOT, f);
  if (!(await fs.stat(p).catch(()=>null))) continue;
  const text = await fs.readFile(p, "utf8");
  if (!/href\s*=\s*["']\//.test(text)) offenders.backHome.push(rel(p));
}

let failed = false;
function section(title, arr, fix) {
  if (!arr.length) return;
  failed = true;
  console.error(`\n ${title}`);
  for (const a of arr) console.error("  - " + a);
  if (fix) console.error("   " + fix);
}

section(
  "Mojibake / encoding junk detected",
  offenders.mojibake,
  "Run: npm run fix:mojibake  (then re-stage changes)."
);
section(
  "JSX text contains raw '->' (escape as -&gt; or use &rarr;)",
  offenders.jsxArrows,
  "Fix: replace '->' with '-&gt;' (or &rarr;) inside JSX text nodes."
);
section(
  "Hard-coded prices found outside src/lib/prices.ts",
  offenders.prices,
  "Fix: import { PRICES } from \"@/lib/prices\" and use {PRICES.lite}/{PRICES.elite}."
);
section(
  "Missing Back home link on success/invoice pages",
  offenders.backHome,
  "Fix: add <a href=\"/\" ...>← Back home</a> near top."
);

if (failed) {
  console.error("\nGuardrails failed. Fix the issues above and commit again.");
  process.exit(1);
} else {
  console.log(" Guardrails passed.");
}