// src/lib/stripe.ts

/**
 * Frontend should NEVER use STRIPE_SECRET_KEY.
 * Only expose public price IDs and safe helpers.
 * Private Stripe client lives only in backend/server.ts
 */

// Map of price IDs (public, safe for frontend)
export const PRICES = {
  LITE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE ?? "",
  ELITE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE ?? "",
  DONATION_ONE_TIME: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATION_ONE_TIME ?? "",
};

// Optionally, validate they exist in dev mode
if (process.env.NODE_ENV !== "production") {
  for (const [plan, id] of Object.entries(PRICES)) {
    if (!id) {
      console.warn(`[stripe] Missing env var for ${plan}`);
    }
  }
}
