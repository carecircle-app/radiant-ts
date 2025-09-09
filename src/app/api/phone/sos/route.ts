import { NextRequest, NextResponse } from "next/server";
import { withTier } from "@/lib/withTier";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withTier("FREE", async (req: NextRequest, user) => {
  const body = await req.json().catch(() => ({}));
  const rec = await prisma.sosEvent.create({
    data: { userId: user.id, payload: body }
  });
  return NextResponse.json({ ok: true, id: rec.id, kind: "sos" });
});
