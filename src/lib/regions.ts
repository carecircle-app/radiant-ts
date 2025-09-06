// src/lib/regions.ts
/**
 * Global helpers: locale, currency, and region-aware payment method selection.
 * Safe-by-default: we always enable automatic payment methods,
 * and only pass explicit method types that are ALSO in your allowlist env.
 */

export const SUPPORTED_LOCALES = [
  "en", "en-GB", "es", "fr", "de", "it", "nl",
  "pt", "pt-BR", "ja", "ko", "zh-CN", "zh-TW", "hi"
] as const;
export type AppLocale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: AppLocale = "en";

// Stripe Checkout accepted locales are similar; we'll pass-through when possible.
export function normalizeLocale(input?: string | null): AppLocale | "auto" {
  if (!input) return DEFAULT_LOCALE;
  const lc = input.toLowerCase();

  // direct hit
  for (const l of SUPPORTED_LOCALES) if (l.toLowerCase() === lc) return l;

  // language only (e.g., "es-419" -> "es")
  const base = lc.split(",")[0].trim().split(";")[0].trim().split("-")[0];
  const asBase = SUPPORTED_LOCALES.find(l => l.toLowerCase() === base);
  return (asBase ?? DEFAULT_LOCALE);
}

export function pickLocaleFromHeaders(h: Headers): AppLocale | "auto" {
  const al = h.get("accept-language");
  return normalizeLocale(al);
}

/* ---------- Currency ---------- */

export const SUPPORTED_CURRENCIES = [
  "USD","EUR","GBP","INR","BRL","MXN","JPY","CAD","AUD","SGD"
] as const;
export type Currency = typeof SUPPORTED_CURRENCIES[number];
export const DEFAULT_CURRENCY: Currency = "USD";

export function normalizeCurrency(input?: string | null): Currency {
  const c = (input || "").toUpperCase();
  if ((SUPPORTED_CURRENCIES as readonly string[]).includes(c)) return c as Currency;
  return DEFAULT_CURRENCY;
}

/* ---------- Payment methods by country (recommended) ---------- */
/**
 * We recommend methods by country, then intersect with an allowlist env to avoid Stripe errors.
 * Set PAYMENT_METHODS_ALLOWLIST=card,link,sepa_debit,ideal,bancontact,giropay,sofort,affirm,klarna,us_bank_account,cashapp,pix,boleto,oxxo,upi,bacs_debit
 * Only methods in that allowlist are ever sent to Stripe.
 */
const RECOMMENDED_BY_COUNTRY: Record<string, string[]> = {
  US: ["card","link","us_bank_account","cashapp","affirm"],
  CA: ["card","link"],
  GB: ["card","link","bacs_debit","klarna"],
  IE: ["card","link","sepa_debit","sofort"],
  FR: ["card","link","sepa_debit","bancontact","ideal","klarna"],
  DE: ["card","link","sepa_debit","giropay","sofort","klarna"],
  NL: ["card","link","ideal"],
  BE: ["card","link","bancontact"],
  ES: ["card","link","sepa_debit","klarna"],
  IT: ["card","link","sepa_debit","klarna"],
  PT: ["card","link","sepa_debit"],
  BR: ["card","link","pix","boleto"],
  MX: ["card","link","oxxo"],
  IN: ["card","link","upi"],
  JP: ["card","link"], // add konbini if your account supports it
  AU: ["card","link"],
  SG: ["card","link"],
};

function getAllowlist(): string[] {
  const raw = (process.env.PAYMENT_METHODS_ALLOWLIST || "").trim();
  if (!raw) return ["card","link"]; // safe baseline everywhere
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

/**
 * Compute method types for a given country code (ISO alpha-2).
 * We always enable automatic_payment_methods; explicit list is optional.
 */
export function resolvePaymentMethodTypes(country?: string | null): string[] {
  const allow = new Set(getAllowlist());
  const cc = (country || "").toUpperCase();
  const rec = RECOMMENDED_BY_COUNTRY[cc] || ["card","link"];
  const filtered = rec.filter(m => allow.has(m));
  // If intersection is empty, fall back to allowlist (still safe)
  return filtered.length ? filtered : Array.from(allow);
}
