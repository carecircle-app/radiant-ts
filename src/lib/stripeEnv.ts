/**
 * src/lib/stripeEnv.ts
 * Normalizes public env var names for Stripe Price IDs.
 * Accepts several legacy names; exports one clean object.
 */
export type StripeEnv = {
  lite?: string;          // $4.99 monthly
  elite?: string;         // $9.99 monthly
  donateOne?: string;     // one-time donation
  donateMonthly?: string; // recurring donation
};

function pick(...candidates: Array<string | undefined>) {
  for (const v of candidates) if (v && v.trim()) return v.trim();
  return undefined;
}

export const STRIPE_ENV: StripeEnv = {
  // Intended canonical names:
  lite: pick(
    process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE_ID,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE_MONTHLY,  // legacy
  ),

  elite: pick(
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_ID,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY, // legacy
  ),

  // Donations  canonical names (fix typos like DONATION vs DONATE)
  donateOne: pick(
    process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_ONETIME,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATION_ONE_TIME, // legacy
  ),

  donateMonthly: pick(
    process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_MONTHLY,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATION,          // legacy
  ),
};
