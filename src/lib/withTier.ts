// copy
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "./auth";
import { hasTier, type Tier } from "./tier";

export function withTier(min: Tier, handler: (req: NextRequest, user: SessionUser) => Promise<Response>) {
  return async (req: NextRequest) => {
    const user = await getSessionUser(req as unknown as Request);
    if (!user || !hasTier(user.tier, min)) {
      return NextResponse.json({ error: `Requires ${min} tier` }, { status: 402 });
    }
    return handler(req, user);
  };
}
