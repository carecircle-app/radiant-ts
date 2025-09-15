import "server-only";

export const DONATION_BENEFICIARY =
  process.env.DONATION_BENEFICIARY || "CareCircle Global Foundation";

export const DONATION_LITE_CENTS = Number(process.env.DONATION_LITE_CENTS ?? "50");
export const DONATION_ELITE_CENTS = Number(process.env.DONATION_ELITE_CENTS ?? "100");

export type Tier = "lite" | "elite" | "unknown";

export function tierForPrice(priceId?: string | null): Tier {
  if (!priceId) return "unknown";
  const elite = process.env.STRIPE_PRICE_ELITE || process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE || "";
  const lite  = process.env.STRIPE_PRICE_LITE  || process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE  || "";
  if (elite && priceId === elite) return "elite";
  if (lite  && priceId === lite)  return "lite";
  return "unknown";
}

export function donationCentsForTier(tier: Tier) {
  if (tier === "elite") return DONATION_ELITE_CENTS;
  if (tier === "lite")  return DONATION_LITE_CENTS;
  return 0;
}