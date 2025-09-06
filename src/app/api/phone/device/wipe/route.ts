// copy
import { NextRequest, NextResponse } from "next/server";
import { withTier } from "@/lib/withTier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = withTier("ELITE", async (_req: NextRequest) => {
  return NextResponse.json({ ok: true, action: "remote_wipe_initiated" });
});
