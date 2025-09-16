export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { NextResponse } from "next/server";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "http://127.0.0.1:3000";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.warn("[stripe] STRIPE_SECRET_KEY is missing");
}
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const priceId = searchParams.get("priceId");
    const mode = (searchParams.get("mode") || "subscription") as
      | "subscription"
      | "payment";

    if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    if (!stripe)  return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

    await stripe.prices.retrieve(priceId);

    const successUrl = `${BASE}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${BASE}/#pricing`;
    console.log("[checkout] BASE=", BASE);
    console.log("[checkout] success_url=", successUrl);
    console.log("[checkout] cancel_url=", cancelUrl);

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.redirect(session.url!, 303);
  } catch (err: any) {
    console.error("[stripe checkout]", err?.message || err);
    return NextResponse.json({ error: err?.message ?? "checkout error" }, { status: 500 });
  }
}
