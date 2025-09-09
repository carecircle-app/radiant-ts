// src/app/api/billing/receipts/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// IMPORTANT: use BACKEND, not APP_BASE_URL, so we don't loop.
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4001";

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const url = `${BACKEND}/api/billing/receipts${qs ? `?${qs}` : ""}`;

  // Add an 8s timeout so we never hang indefinitely.
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);

  try {
    const r = await fetch(url, { cache: "no-store", signal: ac.signal });
    clearTimeout(t);

    if (!r.ok) {
      return NextResponse.json({ error: `Upstream error: ${r.status}` }, { status: 502 });
    }

    const data = await r.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    clearTimeout(t);
    return NextResponse.json({ error: err?.message ?? "Proxy failed" }, { status: 500 });
  }
}

