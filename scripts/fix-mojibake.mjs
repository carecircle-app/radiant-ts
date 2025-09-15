import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";

const ROOT = process.cwd();
const UTF8 = new (TextEncoder)();

const MAP = new Map(Object.entries({
  "Â ": " ",
  "Â": "",
  "Â": "",
  "Â": "®",
  "Â°": "°",
  "â„¢": "™",
  "â€™": "'",
  "â€˜": "'",
  "â€œ": "\"",
  "â€\x9D": "\"",
  "â€“": "-",
  "â": "-",
  "â": "",
  "â": "...",
  "Ãââ": "'",
  "ÃâÅ": "\"",
  "ÃâÂ": "",
  "Ãââœ": "-",
  "Ãââ": "-",
  "ÃâžÂ": "",
  "ÃƒâšÃÂ": ""
}));

const files = await fg(["**/*.{ts,tsx,js,jsx,md,mdx,json,css,scss,sass,html,svg,txt,csv}"], {
  dot: true,
  ignore: ["**/node_modules/**","**/.next/**","**/.git/**","**/*.encodingfix.*.bak"]
});

let changed = 0;
for (const f of files) {
  const p = path.resolve(ROOT, f);
  let txt = await fs.readFile(p, "utf8");
  const orig = txt;
  for (const [bad, good] of MAP.entries()) {
    const re = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    txt = txt.replace(re, good);
  }
  if (txt !== orig) {
    const stamp = new Date().toISOString().replace(/[:.]/g,"-");
    await fs.copyFile(p, `${p}.encodingfix.${stamp}.bak`);
    await fs.writeFile(p, txt, "utf8");
    changed++;
  }
}
console.log(`Fixed mojibake in ${changed} file(s).`);