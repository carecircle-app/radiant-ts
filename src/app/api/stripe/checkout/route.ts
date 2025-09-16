// src/app/api/stripe/checkout/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { NextResponse } from "next/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.warn("[stripe] STRIPE_SECRET_KEY is missing");
}
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" }) : null;

// Build an absolute site URL that works on Vercel previews & prod
function siteBase(req: Request) {
  // 1) Explicit override (recommended for prod custom domain)
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (envBase) return envBase;

  // 2) Vercel preview/prod (e.g. my-app-git-...-username.vercel.app)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // 3) Fallback to request origin (works locally)
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const priceId = searchParams.get("priceId");
    const mode = (searchParams.get("mode") || "subscription") as "subscription" | "payment";

    if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    if (!stripe)  return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

    // Validate price exists to catch typos early
    await stripe.prices.retrieve(priceId);

    const BASE = siteBase(req);
    const success_url = `${BASE}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url  = `${BASE}/#pricing`;

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
    });

    return NextResponse.redirect(session.url!, 303);
  } catch (err: any) {
    console.error("[stripe checkout]", err?.message || err);
    return NextResponse.json({ error: err?.message ?? "checkout error" }, { status: 500 });
  }
}
