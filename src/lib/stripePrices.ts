export function priceFor(plan: string): string | undefined {
  const g = (k: string) =>
    (typeof process !== "undefined" ? process.env[k] : undefined) as string | undefined;

  const pick = (...keys: string[]) => keys.map(g).find(Boolean);

  switch (plan) {
    case "lite":
      return pick(
        "STRIPE_PRICE_LITE",
        "NEXT_PUBLIC_STRIPE_PRICE_LITE",
        "NEXT_PUBLIC_STRIPE_PRICE_LITE_MONTHLY"
      );
    case "elite":
      return pick(
        "STRIPE_PRICE_ELITE",
        "NEXT_PUBLIC_STRIPE_PRICE_ELITE",
        "NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY"
      );
    case "donation":
      return pick(
        "STRIPE_PRICE_DONATION",
        "NEXT_PUBLIC_STRIPE_PRICE_DONATION",
        "NEXT_PUBLIC_STRIPE_PRICE_DONATION_MONTHLY",
        "NEXT_PUBLIC_STRIPE_PRICE_DONATION_ONETIME"
      );
    default:
      return undefined;
  }
}