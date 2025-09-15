import { NextRequest, NextResponse } from "next/server";
import { stripe, assertServer } from "@/lib/stripe";
import { DONATION_BENEFICIARY } from "@/lib/donations";

export async function POST(req: NextRequest) {
  try {
    assertServer();
    const body = await req.json();
    const raw = Number(body?.amountCents ?? 0);
    // $2 to $500 clamp
    const amount = Math.max(200, Math.min(50000, Math.floor(raw)));

    const origin = req.nextUrl.origin;
    const success_url = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url  = `${origin}/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: { name: `${DONATION_BENEFICIARY} Donation` },
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      metadata: {
        donation_beneficiary: DONATION_BENEFICIARY,
        donation_cents: String(amount),
        type: "one-time-donation",
      },
    });

    if (!session?.url) throw new Error("Stripe did not return a checkout URL.");
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: any) {
    console.error("[donate POST] error", e);
    return NextResponse.json({ error: e?.message || "Stripe error" }, { status: 500 });
  }
}