// src/app/api/billing/receipts.csv/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4001";

// Basic CSV escaping
const esc = (v: unknown) => {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const url = `${BACKEND}/api/billing/receipts${qs ? `?${qs}` : ""}`;

  // Timeout so the request never hangs forever
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);

  try {
    const r = await fetch(url, { cache: "no-store", signal: ac.signal });
    clearTimeout(t);

    if (!r.ok) {
      return new NextResponse(`Upstream error: ${r.status}`, { status: 502 });
    }

    const { receipts } = (await r.json()) as { receipts?: any[] };

    const headers = [
      "ts_iso",
      "type",
      "email",
      "customer_email",
      "amount_total",
      "amount_paid",
      "amount_due",
      "amount",
      "currency",
      "status",
      "mode",
      "subscription",
      "invoice",
      "hosted_invoice_url",
    ];

    const rows: string[] = [headers.join(",")];

    for (const x of receipts ?? []) {
      rows.push(
        [
          x?.ts_iso ?? (x?.ts ? new Date(x.ts).toISOString() : ""),
          x?.type ?? "",
          x?.email ?? "",
          x?.customer_email ?? "",
          x?.amount_total ?? "",
          x?.amount_paid ?? "",
          x?.amount_due ?? "",
          x?.amount ?? "",
          (x?.currency || "").toUpperCase(),
          x?.status ?? "",
          x?.mode ?? x?.metadata?.plan ?? "",
          x?.subscription ?? "",
          x?.invoice ?? "",
          x?.hosted_invoice_url ?? "",
        ]
          .map(esc)
          .join(","),
      );
    }

    const body = rows.join("\n");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="receipts.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    clearTimeout(t);
    return new NextResponse(`Proxy failed: ${err?.message ?? "error"}`, { status: 500 });
  }
}
