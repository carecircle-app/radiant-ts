// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- Stripe client ---------- */
const SECRET = (process.env.STRIPE_SECRET_KEY || "").trim();
if (!SECRET.startsWith("sk_")) {
  throw new Error("STRIPE_SECRET_KEY is missing/invalid in env.");
}
// NOTE: omit apiVersion to avoid TS literal mismatch (uses account default)
const stripe = new Stripe(SECRET);

/* ---------- App base (for return URLs) ---------- */
const appBase = (
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  process.env.APP_BASE_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

/* ---------- Helpers ---------- */
function firstDefined(keys: string[]) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.trim()) return v.trim();
  }
  return undefined;
}

function priceFor(plan: string | null | undefined) {
  const p = (plan || "").toLowerCase();
  switch (p) {
    case "lite":
      return firstDefined(["STRIPE_PRICE_LITE", "STRIPE_PRICE_LITE_MONTHLY"]);
    case "elite":
      return firstDefined(["STRIPE_PRICE_ELITE", "STRIPE_PRICE_ELITE_MONTHLY"]);
    // one-time donation
    case "donation":
    case "donation-one-time":
      return firstDefined([
        "STRIPE_PRICE_DONATION_ONE_TIME",
        "STRIPE_PRICE_DONATION",
      ]);
    // monthly/recurring donation
    case "donation-monthly":
      return firstDefined([
        "STRIPE_PRICE_DONATION",
        "STRIPE_PRICE_DONATION_MONTHLY",
      ]);
    default:
      return undefined;
  }
}

function modeFor(plan: string | null | undefined): "payment" | "subscription" {
  const p = (plan || "").toLowerCase();
  return p === "donation" || p === "donation-one-time" ? "payment" : "subscription";
}

/** Local timeout guard (doesn't cancel the underlying HTTP request) */
function withTimeout<T>(p: Promise<T>, ms: number, message = "Timeout"): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]) as Promise<T>;
}

/* ---------- CORS (dev-friendly) ---------- */
function corsHeaders(origin?: string) {
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
  if (origin) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Vary"] = "Origin";
  }
  return h;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

/* ---------- POST /api/stripe/checkout ---------- */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;

  // plan can come from ?plan= or JSON body { plan }
  const url = new URL(req.url);
  let plan = url.searchParams.get("plan");
  if (!plan) {
    try {
      const body = await req.json();
      if (typeof body?.plan === "string") plan = body.plan;
    } catch {
      /* no JSON body is fine */
    }
  }

  const price = priceFor(plan);
  if (!plan || !price) {
    return NextResponse.json(
      {
        error: `No price mapped for plan="${plan}". Set STRIPE_PRICE_* envs.`,
        seen: {
          LITE:
            !!process.env.STRIPE_PRICE_LITE ||
            !!process.env.STRIPE_PRICE_LITE_MONTHLY,
          ELITE:
            !!process.env.STRIPE_PRICE_ELITE ||
            !!process.env.STRIPE_PRICE_ELITE_MONTHLY,
          DONATION_ONE_TIME: !!process.env.STRIPE_PRICE_DONATION_ONE_TIME,
          DONATION:
            !!process.env.STRIPE_PRICE_DONATION ||
            !!process.env.STRIPE_PRICE_DONATION_MONTHLY,
        },
      },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const mode = modeFor(plan);

  // Idempotency: bucket by minute + plan + client IP
  const minute = Math.floor(Date.now() / 60000);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "n/a";
  const idempotencyKey = `cs:${mode}:${plan}:${ip}:${minute}`;

  try {
    // âœ… The only behavioral change from your broken version: clean URLs (no backslashes)
    const session = await withTimeout(
      stripe.checkout.sessions.create(
        {
          mode,
          ...(mode === "payment" ? { customer_creation: "always" as const } : {}),
          line_items: [{ price, quantity: 1 }],
          success_url: `${appBase}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appBase}/cancel`,
          allow_promotion_codes: true,
          billing_address_collection: "auto",
        },
        { idempotencyKey }
      ),
      8000,
      "Stripe session create timed out"
    );

    // Retry once if URL is briefly absent
    let checkoutUrl = session.url ?? undefined;
    if (!checkoutUrl) {
      const fresh = await withTimeout(
        stripe.checkout.sessions.retrieve(session.id),
        5000,
        "Stripe session retrieve timed out"
      );
      checkoutUrl = fresh.url ?? undefined;
    }

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          error: "Stripe created a session but no URL was returned.",
          session_id: session.id,
          mode,
          plan,
        },
        { status: 502, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { url: checkoutUrl },
      { status: 200, headers: corsHeaders(origin) }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create Stripe Checkout session." },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

/* ---------- Guard: POST-only ---------- */
export function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
