// vercel-precheck.js
// Lightweight, non-blocking checks before `next build`.

const fs = require("fs");
const path = require("path");

// Node version check (Next 15 works on >=18.17; we’re on 22.x locally)
const major = Number(process.versions.node.split(".")[0]);
if (major < 18) {
  console.warn(`[precheck] Node ${process.version} is too old. Use >= 18.17.`);
}

// Load local env only when not on Vercel
if (!process.env.VERCEL) {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    try { require("dotenv").config({ path: envPath }); }
    catch (e) { console.warn(`[precheck] dotenv load failed: ${e.message}`); }
  } else {
    console.warn("[precheck] .env.local not found (ok on CI; recommended locally).");
  }
}

// Warn if important envs are missing (do NOT fail build)
const required = [
  "NEXT_PUBLIC_APP_BASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_LITE_MONTHLY",
  "STRIPE_PRICE_ELITE_MONTHLY",
  "STRIPE_PRICE_DONATION_ONE_TIME",
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(`[precheck] Missing env vars: ${missing.join(", ")}`);
}

console.log("[precheck] ok");
