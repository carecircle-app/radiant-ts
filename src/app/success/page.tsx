// src/app/success/page.tsx
// Server Component (no "use client")
// Rich success screen with subscription/payment details, safe for Next 15+
import Link from "next/link";
import { headers } from "next/headers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ----------------------------- Types (loose) ----------------------------- */
type LineItem = {
  description?: string | null;
  quantity?: number | null;
  amount_subtotal?: number | null;
  amount_total?: number | null;
  currency?: string | null;
  price_id?: string | null;
};

type SessionInfo = {
  id?: string;
  mode?: "payment" | "subscription" | null;
  status?: string | null;

  // Common session bits
  customer_id?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  payment_status?: string | null;

  // Amounts
  amount_subtotal?: number | null;
  amount_total?: number | null;
  currency?: string | null;

  // Invoice/receipt
  invoice_id?: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;

  // Payment/Subscription refs
  payment_intent_id?: string | null;
  subscription_id?: string | null;

  // Subscription windows (epoch seconds)
  current_period_start?: number | null;
  current_period_end?: number | null;

  // Timestamps
  created?: number | null;

  // Items
  line_items?: LineItem[] | null;

  // For debug
  _raw?: unknown;
};

/* ------------------------------ Utilities ------------------------------- */
function fmtMoney(amt?: number | null, cur?: string | null, locale = "en") {
  if (typeof amt !== "number" || !cur) return null;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur.toUpperCase(),
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amt / 100);
  } catch {
    return `${(amt / 100).toFixed(2)} ${cur.toUpperCase()}`;
  }
}

function fmtDate(ts?: number | null, locale = "en") {
  if (!ts || typeof ts !== "number") return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(ts * 1000));
  } catch {
    const d = new Date(ts * 1000);
    return d.toISOString();
  }
}

/* ------------------------------- Page ----------------------------------- */
export default async function SuccessPage({
  // NOTE: Next 15+ sometimes passes a Promise for searchParams â€” await it.
  searchParams,
}: {
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const sp =
    typeof (searchParams as any)?.then === "function"
      ? await (searchParams as Promise<Record<string, string | string[] | undefined>>)
      : (searchParams as Record<string, string | string[] | undefined>);

  const session_id = (Array.isArray(sp?.session_id) ? sp.session_id[0] : sp?.session_id) as
    | string
    | undefined;

  if (!session_id) {
    return (
      <Wrapper>
        <Title text="Missing session_id" danger />
        <P>
          We couldn&apos;t find a Stripe session. Please return to the home page and try again.
        </P>
        <PrimaryLink href="/">Back to Home</PrimaryLink>
      </Wrapper>
    );
  }

  const hdrs = await headers();
const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
const proto = hdrs.get("x-forwarded-proto") ?? "http";
const origin = `${proto}://${host}`;// Ask your API route to normalize & expand the session for us.
  const res = await fetch(
    `${origin}/api/stripe/session?session_id=${encodeURIComponent(session_id)}`,
    { cache: "no-store", headers: { Accept: "application/json" } }
  );

  if (!res.ok) {
    const msg = await safeText(res);
    return (
      <Wrapper>
        <Title text="Error loading session" danger />
        <P>
          {res.status} â€” {msg || "Unexpected error"}
        </P>
        <PrimaryLink href="/">Back to Home</PrimaryLink>
      </Wrapper>
    );
  }

  const data = (await safeJson<SessionInfo>(res)) || {};
  const isSub = data.mode === "subscription";

  const amountStr =
    fmtMoney(data.amount_total ?? null, data.currency ?? null) ||
    fmtMoney(data.amount_subtotal ?? null, data.currency ?? null);

  const createdStr = fmtDate(data.created ?? null);
  const curStart = fmtDate(data.current_period_start ?? null);
  const curEnd = fmtDate(data.current_period_end ?? null);

  /* ------------------------------ Render -------------------------------- */
  return (
    <Wrapper>
      <Title text="Thank you!" />
      <P>
        {isSub ? "Your subscription was started successfully." : "Your payment was processed successfully."}
      </P>

      <Section title="Summary">
        <Grid>
          <KV k="Session" v={data.id} mono />
          <KV k="Mode" v={data.mode} />
          <KV k="Status" v={data.status} />
          <KV k="Email" v={data.customer_email} />
          <KV k="Name" v={data.customer_name} />
          <KV k="Customer" v={data.customer_id} mono />
          <KV k="Amount" v={amountStr} />
          <KV k="Currency" v={data.currency?.toUpperCase()} />
          <KV k="Created" v={createdStr} />
          {isSub && (
            <>
              <KV k="Subscription" v={data.subscription_id} mono />
              <KV k="Current period start" v={curStart} />
              <KV k="Current period end" v={curEnd} />
            </>
          )}
          {!isSub && <KV k="Payment Intent" v={data.payment_intent_id} mono />}
          {data.invoice_id && <KV k="Invoice" v={data.invoice_id} mono />}
        </Grid>
      </Section>

      {!!data.line_items?.length && (
        <Section title="Items">
          <ItemsTable items={data.line_items!} currency={data.currency ?? null} />
        </Section>
      )}

      {(data.hosted_invoice_url || data.invoice_pdf) && (
        <Section title="Invoice">
          <div className="flex flex-wrap gap-3">
            {data.hosted_invoice_url && (
              <a
                className="text-blue-600 underline"
                href={data.hosted_invoice_url}
                target="_blank"
                rel="noreferrer"
              >
                View invoice
              </a>
            )}
            {data.invoice_pdf && (
              <a className="text-blue-600 underline" href={data.invoice_pdf} target="_blank" rel="noreferrer">
                Download PDF
              </a>
            )}
          </div>
        </Section>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <PrimaryLink href="/">Back to Home</PrimaryLink>
        <span className="text-sm text-gray-500">Keep this window for your records if needed.</span>
      </div>

      {/* Collapsible debug to help support without cluttering UI */}
      <details className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <summary className="cursor-pointer select-none text-sm font-semibold text-gray-700">
          Debug (session payload)
        </summary>
        <pre className="mt-3 overflow-x-auto rounded bg-white p-3 text-xs leading-relaxed text-gray-800">
{JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </Wrapper>
  );
}

/* ------------------------------ Helpers --------------------------------- */
async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ------------------------------ UI Bits --------------------------------- */
function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl p-8">{children}</div>;
}
function Title({ text, danger = false }: { text: string; danger?: boolean }) {
  return (
    <h1 className={`text-3xl font-bold ${danger ? "text-red-600" : "text-gray-900"}`}>{text}</h1>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-gray-700">{children}</p>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
function KV({ k, v, mono = false }: { k: string; v?: React.ReactNode | null; mono?: boolean }) {
  if (v == null || v === "") return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{k}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : ""}`}>{v}</div>
    </div>
  );
}

function ItemsTable({ items, currency }: { items: LineItem[]; currency: string | null }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <Th>Description</Th>
            <Th className="text-right">Qty</Th>
            <Th className="text-right">Subtotal</Th>
            <Th className="text-right">Total</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((it, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <Td>{it.description ?? "â€”"}</Td>
              <Td className="text-right">{it.quantity ?? "â€”"}</Td>
              <Td className="text-right">
                {fmtMoney(it.amount_subtotal ?? null, currency) ?? "â€”"}
              </Td>
              <Td className="text-right">{fmtMoney(it.amount_total ?? null, currency) ?? "â€”"}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 ${className}`}>
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-2 ${className}`}>{children}</td>;
}
function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-block rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
    >
      {children}
    </Link>
  );
}

