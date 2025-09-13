import { NextRequest, NextResponse } from "next/server";
import { stripe, assertServer } from "@/lib/stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;

async function createCheckout(priceId: string, req: NextRequest) {
  assertServer();
  const origin = req.nextUrl.origin;
  const success_url = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url  = `${origin}/cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url,
    cancel_url,
    allow_promotion_codes: true,
  });

  if (!session?.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();
    if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    if (!stripeKey) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });

    const url = await createCheckout(priceId, req);
    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    console.error("[checkout POST] error", e);
    return NextResponse.json({ error: e?.message || "Stripe error" }, { status: 500 });
  }
}

// Legacy/query fallback (?priceId=...) used by buttons if POST fails
export async function GET(req: NextRequest) {
  try {
    const priceId = req.nextUrl.searchParams.get("priceId");
    if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    if (!stripeKey) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });

    const url = await createCheckout(priceId, req);
    return NextResponse.redirect(url, { status: 303 });
  } catch (e: any) {
    console.error("[checkout GET] error", e);
    return NextResponse.json({ error: e?.message || "Stripe error" }, { status: 500 });
  }
}