// src/lib/stripe.ts
import "server-only";
import Stripe from "stripe";

/**
 * Server-only Stripe singleton.
 * Avoids hard-coding apiVersion so it stays compatible with the SDK types
 * and uses the version tied to your secret key in Stripe.
 */

let _stripe: Stripe | null = null;

function requireSecret(): string {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key || !key.startsWith("sk_")) {
    throw new Error("STRIPE_SECRET_KEY is missing/invalid in environment.");
  }
  return key;
}

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  _stripe = new Stripe(requireSecret());
  return _stripe;
}

/** Convenience export for places that do `import { stripe } from '@/lib/stripe'` */
export const stripe = getStripe();

/** Optional: quick feature flag for guards */
export const hasStripe = !!(process.env.STRIPE_SECRET_KEY || "").trim();
