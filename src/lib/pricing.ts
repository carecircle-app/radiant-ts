// src/lib/pricing.ts
export type PriceKey = "LITE_MONTHLY" | "ELITE_MONTHLY" | "DONATION_ONE_TIME";

export type KnownPrice = {
  key: PriceKey;
  label: string;
  envVar: string;
  id?: string;
};

export const PRICES: KnownPrice[] = [
  {
    key: "LITE_MONTHLY",
    label: "Lite — Monthly",
    envVar: "STRIPE_PRICE_LITE_MONTHLY",
    id: process.env.STRIPE_PRICE_LITE_MONTHLY || undefined,
  },
  {
    key: "ELITE_MONTHLY",
    label: "Elite — Monthly",
    envVar: "STRIPE_PRICE_ELITE_MONTHLY",
    id: process.env.STRIPE_PRICE_ELITE_MONTHLY || undefined,
  },
  {
    key: "DONATION_ONE_TIME",
    label: "Donation — One-Time",
    envVar: "STRIPE_PRICE_DONATION_ONE_TIME",
    id: process.env.STRIPE_PRICE_DONATION_ONE_TIME || undefined,
  },
];

// Optional: if you later add monthly donations, just add a new entry here:
// {
//   key: "DONATION_MONTHLY",
//   label: "Donation — Monthly",
//   envVar: "STRIPE_PRICE_DONATION",
//   id: process.env.STRIPE_PRICE_DONATION || undefined,
// }

export function getConfiguredPrices() {
  return PRICES.map(p => ({ ...p }));
}
