// src/app/admin/pricing/page.tsx
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { SUPPORTED_CURRENCIES, type Currency } from "@/lib/regions";
import { getPriceId, type PlanKey } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Plans we support
const PLANS: { key: PlanKey; label: string }[] = [
  { key: "LITE_MONTHLY", label: "Lite — Monthly" },
  { key: "ELITE_MONTHLY", label: "Elite — Monthly" },
  { key: "DONATION_ONE_TIME", label: "Donation — One-Time" },
];

type Cell = {
  currency: Currency;
  envId?: string;
  found: boolean;
  active?: boolean;
  amount?: number | null;
  nickname?: string | null;
  productName?: string | null;
  error?: string | null;
};

type Row = {
  plan: PlanKey;
  label: string;
  cells: Record<Currency, Cell>;
};

function toCurrencyList(): Currency[] {
  // Copy to a plain array so we can map cleanly
  return [...SUPPORTED_CURRENCIES];
}

function isActiveProduct(
  p: Stripe.Product | Stripe.DeletedProduct
): p is Stripe.Product {
  return !("deleted" in p && p.deleted === true);
}

async function buildRows(): Promise<Row[]> {
  const currencies = toCurrencyList();

  const rows: Row[] = [];
  for (const { key, label } of PLANS) {
    const cells: Record<Currency, Cell> = {} as any;

    for (const c of currencies) {
      const envId = getPriceId(key, c);
      if (!envId) {
        cells[c] = {
          currency: c,
          envId: undefined,
          found: false,
          error: "Missing env",
        };
        continue;
      }

      try {
        const price = await stripe.prices.retrieve(envId);

        let productName: string | null = null;
        if (typeof price.product === "string") {
          try {
            const prod = await stripe.products.retrieve(price.product);
            productName = isActiveProduct(prod) ? prod.name ?? null : null;
          } catch {
            productName = null;
          }
        } else {
          productName = isActiveProduct(price.product) ? price.product.name ?? null : null;
        }

        cells[c] = {
          currency: c,
          envId,
          found: true,
          active: price.active,
          amount: price.unit_amount ?? null,
          nickname: price.nickname ?? null,
          productName,
        };
      } catch (err: any) {
        cells[c] = {
          currency: c,
          envId,
          found: false,
          error: err?.message ?? "Not found",
        };
      }
    }

    rows.push({ plan: key, label, cells });
  }

  return rows;
}

function fmtAmount(amount?: number | null, currency?: Currency) {
  if (amount == null || !currency) return "—";
  const unit = amount / 100;
  try {
    return unit.toLocaleString(undefined, {
      style: "currency",
      currency,
    });
  } catch {
    return `${unit.toFixed(2)} ${currency}`;
  }
}

function Badge({ ok }: { ok?: boolean }) {
  return ok ? (
    <span className="rounded-full bg-green-100 text-green-800 text-xs px-2 py-0.5">OK</span>
  ) : (
    <span className="rounded-full bg-red-100 text-red-800 text-xs px-2 py-0.5">Check</span>
  );
}

function TestButton({ plan, currency }: { plan: PlanKey; currency: Currency }) {
  // Map plan key to your checkout query values
  const planQuery =
    plan === "LITE_MONTHLY" ? "Lite" :
    plan === "ELITE_MONTHLY" ? "Elite" :
    "donation-one-time";

  return (
    <a
      className="underline text-xs"
      href={`/api/stripe/checkout?plan=${encodeURIComponent(planQuery)}&currency=${currency}`}
      onClick={(e) => {
        e.preventDefault();
        fetch(`/api/stripe/checkout?plan=${encodeURIComponent(planQuery)}&currency=${currency}`, {
          method: "POST",
        })
          .then((r) => r.json())
          .then(({ url, error }) => {
            if (error) alert(error);
            else if (url) window.location.href = url;
          })
          .catch((err) => alert(String(err)));
      }}
    >
      Test →
    </a>
  );
}

export default async function PricingAdminPage() {
  const rows = await buildRows();
  const currencies = toCurrencyList();

  return (
    <main className="max-w-[1100px] mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Pricing Status (Multi-currency)</h1>
      <p className="text-sm text-gray-600">
        Checks configured Price IDs per plan and currency. Missing envs show as “Check”.
      </p>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left align-bottom">
              <th className="px-4 py-3 w-40">Plan</th>
              {currencies.map((c) => (
                <th key={c} className="px-4 py-3">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.plan} className="border-t align-top">
                <td className="px-4 py-3 font-medium whitespace-nowrap">{r.label}</td>
                {currencies.map((c) => {
                  const cell = r.cells[c];
                  return (
                    <td key={`${r.plan}-${c}`} className="px-4 py-3 space-y-1">
                      <div className="font-mono text-xs break-all">
                        {cell.envId ?? "—"}
                      </div>
                      <div>
                        {cell.error ? (
                          <span className="text-red-600 text-xs">{cell.error}</span>
                        ) : (
                          <Badge ok={cell.active} />
                        )}
                      </div>
                      <div className="text-xs">
                        {fmtAmount(cell.amount, c)}
                        {cell.nickname ? ` • ${cell.nickname}` : ""}
                        {cell.productName ? ` • ${cell.productName}` : ""}
                      </div>
                      <div>
                        {cell.found && cell.envId ? (
                          <TestButton plan={r.plan} currency={c} />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Configure envs like <code className="font-mono">STRIPE_PRICE_LITE_MONTHLY_EUR</code>. Missing per-currency prices fall back to <code className="font-mono">USD</code> at checkout.
      </p>
    </main>
  );
}
