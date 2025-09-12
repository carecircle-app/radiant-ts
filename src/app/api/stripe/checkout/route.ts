import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic"; // always run on server

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getOrigin(req: Request) {
  // Works on Vercel and locally
  const xfHost = req.headers.get("x-forwarded-host");
  if (xfHost) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${xfHost}`;
  }
  return new URL(req.url).origin;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const priceId = searchParams.get("priceId");

  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }

  const origin = getOrigin(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",               // change to "payment" if using one-time prices
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
    });

    // 303 to avoid any accidental 307 loops
    return NextResponse.redirect(session.url!, 303);
  } catch (err: any) {
    console.error("Stripe error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Stripe error" },
      { status: 500 }
    );
  }
}
