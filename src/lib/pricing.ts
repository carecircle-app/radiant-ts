export const SUPPORTED_CURRENCIES = ["usd"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
export type PlanKey = "lite" | "elite" | "donation" | "donationMonthly";
const PRICE_ENV: Record<PlanKey, string | undefined> = {
  lite: process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE_MONTHLY,
  elite: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY,
  donation: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATION_ONE_TIME,
  donationMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATION,
};
export function getPriceId(plan: PlanKey): string {
  return PRICE_ENV[plan] ?? "";
}
