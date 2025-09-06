// copy
import type { Tier } from "./tier";
export type SessionUser = { id: string; email?: string; tier: Tier };
export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const mockTier = (req.headers.get("x-mock-tier") || "FREE") as Tier;
  return { id: "demo-user", email: "demo@example.com", tier: mockTier };
}
