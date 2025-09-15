import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2023-10-16" });
const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getPriceIdFrom(req: Request) {
  const { searchParams } = new URL(req.url);
  return searchParams.get("priceId") ?? searchParams.get("price") ?? undefined;
}

// Redirect helper
async function makeSessionAndRedirect(priceId: string) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${ORIGIN}/pricing`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });
  return NextResponse.redirect(session.url!, { status: 303 });
}

export async function GET(req: Request) {
  const priceId = getPriceIdFrom(req);
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }
  try {
    return await makeSessionAndRedirect(priceId);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "stripe_error" }, { status: 500 });
  }
}

// Keep POST support too, but simply reuse the same logic
export async function POST(req: Request) {
  const priceId = getPriceIdFrom(req);
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }
  try {
    return await makeSessionAndRedirect(priceId);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "stripe_error" }, { status: 500 });
  }
}
