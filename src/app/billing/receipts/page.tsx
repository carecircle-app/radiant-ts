// src/app/billing/receipts/page.tsx
import React from "react";

export const runtime = "nodejs";           // allow localhost fetch in dev
export const dynamic = "force-dynamic";    // fresh fetch on each request

type Receipt = {
  ts?: number;
  ts_iso?: string;
  type: string;
  email?: string;
  customer_email?: string;
  amount_total?: number;
  amount_paid?: number;
  amount_due?: number;
  amount?: number;
  currency?: string;
  status?: string;
  mode?: string;
  metadata?: Record<string, any>;
  subscription?: string;
  invoice?: string;
  hosted_invoice_url?: string;
};

// Shared backend base (Express @ 4001 by default)
const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:4001";

async function getReceipts(sp: Record<string, string | undefined>) {
  // Build a string[][] of only defined, non-empty values (TypeScript-safe)
  const pairs = Object.entries(sp).filter(
    (e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""
  );
  const qs = new URLSearchParams(pairs).toString();

  const url = `${BACKEND_BASE}/api/billing/receipts${qs ? `?${qs}` : ""}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) {
    throw new Error(`Receipts fetch failed: ${r.status}`);
  }
  return (await r.json()) as { receipts: Receipt[] };
}

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams?: { email?: string; limit?: string };
}) {
  const sp = searchParams ?? {};

  // Fetch receipts from the backend
  const { receipts } = await getReceipts(sp);

  const email = sp.email ?? "";
  const limit = sp.limit ?? "50";

  // Build CSV query params safely (string[][])
  const csvPairs = Object.entries({ email, limit }).filter(
    (e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""
  );
  const query = new URLSearchParams(csvPairs).toString();

  // ---------- helpers ----------
  const toMs = (r: Receipt) =>
    typeof r.ts === "number" && r.ts
      ? r.ts
      : r.ts_iso
      ? Date.parse(r.ts_iso)
      : 0;

  // Only â€œsignalâ€ events, newest â†’ oldest
  const rows = (receipts ?? [])
    .filter((r) =>
      [
        "payment_intent.succeeded",
        "invoice.paid",
        "checkout.session.completed",
        "charge.succeeded",
      ].includes(r.type)
    )
    .sort((a, b) => toMs(b) - toMs(a));
  // -----------------------------

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">Billing â†’ Receipts</h1>
        <p className="opacity-80 text-sm">
          These rows are captured from Stripe webhooks (dev).
        </p>

        {/* Filter form */}
        <form className="flex flex-wrap items-end gap-3 rounded-2xl border p-4">
          <div className="flex flex-col">
            <label className="text-sm">Filter by email</label>
            <input
              name="email"
              defaultValue={email}
              placeholder="user@example.com"
              className="rounded-xl border px-3 py-2"
              type="email"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm">Limit</label>
            <input
              name="limit"
              defaultValue={limit}
              className="w-28 rounded-xl border px-3 py-2"
              type="number"
              min={1}
              max={500}
            />
          </div>
          <button className="rounded-2xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Apply
          </button>
          <a href="/billing/receipts" className="rounded-2xl border px-4 py-2">
            Clear
          </a>
        </form>

        {/* Download CSV (points to backend) */}
        <div className="flex gap-3">
          <a
            className="rounded-2xl bg-gray-800 px-4 py-2 text-white hover:bg-black"
            href={`${BACKEND_BASE}/api/billing/receipts.csv${query ? `?${query}` : ""}`}
            download="receipts.csv"
          >
            Download CSV
          </a>
        </div>

        {/* Table */}
        <div className="rounded-2xl border p-4 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="py-2">When</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Email</th>
                <th>Status</th>
                <th>Mode/Notes</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r, i) => {
                  const cents =
                    r.amount_total ?? r.amount_paid ?? r.amount_due ?? r.amount ?? 0;
                  const cur = r.currency?.toUpperCase() || "USD";
                  const amtText = cents
                    ? new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: cur,
                      }).format(cents / 100)
                    : "-";
                  const when =
                    r.ts_iso ??
                    (typeof r.ts === "number" ? new Date(r.ts).toISOString() : "-");
                  const em =
                    r.email ?? r.customer_email ?? r.metadata?.email ?? "-";
                  const mode =
                    r.mode ??
                    r.metadata?.plan ??
                    r.subscription ??
                    (r.type?.includes("invoice") ? "invoice" : "-");

                  return (
                    <tr key={i} className="border-t">
                      <td className="py-2">
                        {when !== "-" ? when.replace("T", " ").replace("Z", "") : "-"}
                      </td>
                      <td className="whitespace-nowrap">{r.type}</td>
                      <td>{amtText}</td>
                      <td className="whitespace-nowrap">{em}</td>
                      <td>{r.status ?? "-"}</td>
                      <td className="whitespace-nowrap">{mode}</td>
                      <td>
                        {r.hosted_invoice_url ? (
                          <a
                            className="underline"
                            href={r.hosted_invoice_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Invoice
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="py-4" colSpan={7}>
                    No receipts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
