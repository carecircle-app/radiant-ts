// copy
export type Tier = "FREE" | "LITE" | "ELITE";
export const tierRank: Record<Tier, number> = { FREE: 0, LITE: 1, ELITE: 2 };
export function hasTier(userTier: Tier | undefined, min: Tier): boolean {
  if (!userTier) return false;
  return tierRank[userTier] >= tierRank[min];
}
