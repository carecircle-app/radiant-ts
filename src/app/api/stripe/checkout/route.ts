import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const priceId = url.searchParams.get("priceId");
  if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${url.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url.origin}/cancel`,
    allow_promotion_codes: true,
  });

  return NextResponse.redirect(session.url!, 303);
}
