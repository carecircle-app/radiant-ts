// src/app/admin/stripe/page.tsx
import { promises as fs } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

type JsonMap = Record<string, any>;

async function readJsonSafe(p: string): Promise<JsonMap> {
  try {
    const raw = await fs.readFile(p, "utf8");
    return raw ? (JSON.parse(raw) as JsonMap) : {};
  } catch {
    return {};
  }
}

export default async function StripeAdminPage() {
  const root = process.cwd();
  const dataDir = path.join(root, "data");

  const subs = await readJsonSafe(path.join(dataDir, "stripe-subscriptions.json"));
  const pays = await readJsonSafe(path.join(dataDir, "stripe-payments.json"));
  const invs = await readJsonSafe(path.join(dataDir, "stripe-invoices.json"));

  const subsArr = Object.values(subs);
  const paysArr = Object.values(pays);
  const invsArr = Object.values(invs);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Stripe Admin (read-only)</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Subscriptions ({subsArr.length})</h2>
        <div className="grid gap-3">
          {subsArr.length === 0 && <p className="text-sm text-gray-500">No subscriptions saved yet.</p>}
          {subsArr.map((s: any) => (
            <div key={s.id} className="rounded-2xl border p-4">
              <div className="text-sm text-gray-500">ID</div>
              <div className="font-mono text-sm break-all">{s.id}</div>
              <div className="mt-2 text-sm">
                <span className="font-medium">Status:</span> {s.status ?? "?"} â€¢{" "}
                <span className="font-medium">Customer:</span> {s.customer ?? "?"} â€¢{" "}
                <span className="font-medium">Price:</span> {s.price_id ?? "?"} â€¢{" "}
                <span className="font-medium">Amount:</span> {s.plan_amount ?? "?"} {s.currency ?? ""}
              </div>
              <pre className="mt-3 text-xs overflow-auto max-h-48 bg-gray-50 p-3 rounded">{JSON.stringify(s, null, 2)}</pre>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Payments ({paysArr.length})</h2>
        <div className="grid gap-3">
          {paysArr.length === 0 && <p className="text-sm text-gray-500">No payments saved yet.</p>}
          {paysArr.map((p: any) => (
            <div key={p.id} className="rounded-2xl border p-4">
              <div className="text-sm text-gray-500">ID</div>
              <div className="font-mono text-sm break-all">{p.id}</div>
              <div className="mt-2 text-sm">
                <span className="font-medium">Amount:</span> {p.amount} {p.currency} â€¢{" "}
                <span className="font-medium">Status:</span> {p.status ?? "?"} â€¢{" "}
                <span className="font-medium">Email:</span> {p.email ?? "?"}
              </div>
              <pre className="mt-3 text-xs overflow-auto max-h-48 bg-gray-50 p-3 rounded">{JSON.stringify(p, null, 2)}</pre>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Invoices ({invsArr.length})</h2>
        <div className="grid gap-3">
          {invsArr.length === 0 && <p className="text-sm text-gray-500">No invoices saved yet.</p>}
          {invsArr.map((i: any) => (
            <div key={i.id} className="rounded-2xl border p-4">
              <div className="text-sm text-gray-500">ID</div>
              <div className="font-mono text-sm break-all">{i.id}</div>
              <div className="mt-2 text-sm">
                <span className="font-medium">Subscription:</span> {i.subscription ?? "â€”"} â€¢{" "}
                <span className="font-medium">Paid:</span> {i.amount_paid ?? 0} {i.currency ?? ""} â€¢{" "}
                <span className="font-medium">Status:</span> {i.status ?? "?"}
              </div>
              {i.hosted_invoice_url ? (
                <a
                  href={i.hosted_invoice_url}
                  className="inline-block mt-2 text-sm underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open invoice
                </a>
              ) : null}
              <pre className="mt-3 text-xs overflow-auto max-h-48 bg-gray-50 p-3 rounded">{JSON.stringify(i, null, 2)}</pre>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-gray-500">
        Files read from <code className="font-mono">/data</code>: stripe-subscriptions.json, stripe-payments.json,
        stripe-invoices.json
      </p>
    </main>
  );
}
