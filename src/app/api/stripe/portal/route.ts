// src/app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// â€”â€”â€” Stripe init (avoid literal apiVersion mismatch) â€”â€”â€”
const secret = (process.env.STRIPE_SECRET_KEY || "").trim();
if (!/^sk_/.test(secret)) {
  throw new Error(
    `STRIPE_SECRET_KEY is missing/invalid. Saw prefix "${secret.slice(0, 10)}".`
  );
}
const stripe = new Stripe(secret);

// â€”â€”â€” Helpers â€”â€”â€”
function baseFrom(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost:3000";
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function returnTarget(req: NextRequest) {
  // Prefer explicit app base, fallback to request base
  const base =
    (process.env.NEXT_PUBLIC_APP_BASE_URL || "").trim() || baseFrom(req);
  // Always land users on your receipts page after the portal
  return `${base.replace(/\/+$/, "")}/billing/receipts`;
}

async function resolveCustomerId(req: NextRequest, body?: any) {
  const url = new URL(req.url);
  // Accept multiple names for convenience
  const qpCustomer =
    url.searchParams.get("customer_id") || url.searchParams.get("customer");
  const qpSession = url.searchParams.get("session_id");

  const bodyCustomer = body?.customer_id || body?.customer;
  const bodySession = body?.session_id;

  // 1) Direct customer id wins
  const direct = (qpCustomer || bodyCustomer)?.toString();
  if (direct) return direct;

  // 2) Otherwise derive from a Checkout Session id
  const sid = (qpSession || bodySession)?.toString();
  if (sid) {
    const cs = await stripe.checkout.sessions.retrieve(sid);
    const c = cs.customer;
    return typeof c === "string" ? c : (c && "id" in c ? (c.id as string) : undefined);
  }

  return undefined;
}

/**
 * GET: redirects straight into Billing Portal.
 * Usage examples:
 *   /api/stripe/portal?session_id=cs_...
 *   /api/stripe/portal?customer_id=cus_...
 */
export async function GET(req: NextRequest) {
  const customerId = await resolveCustomerId(req);
  if (!customerId) {
    return NextResponse.json(
      {
        error:
          "Provide ?session_id=cs_... or ?customer_id=cus_... to open the Billing Portal.",
      },
      { status: 400 }
    );
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnTarget(req),
  });

  return NextResponse.redirect(portal.url, { status: 302 });
}

/**
 * POST: returns JSON { url } so the client can navigate.
 * Body (JSON): { customer_id?: string, customer?: string, session_id?: string }
 */
export async function POST(req: NextRequest) {
  let body: any = undefined;
  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }

  const customerId = await resolveCustomerId(req, body);
  if (!customerId) {
    return NextResponse.json(
      {
        error:
          "Missing customer. Send { customer_id } or { session_id } in JSON body, or use ?customer_id= / ?session_id= query params.",
      },
      { status: 400 }
    );
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnTarget(req),
  });

  return NextResponse.json({ url: portal.url }, { status: 200 });
}


