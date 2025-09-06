// copy
import { NextRequest, NextResponse } from "next/server";
import { withTier } from "@/lib/withTier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withTier("LITE", async (req: NextRequest) => {
  const item = await req.json();
  return NextResponse.json({ ok: true, saved: { id: "vault_demo", ...item } });
});
