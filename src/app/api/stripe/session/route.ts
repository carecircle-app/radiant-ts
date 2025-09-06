// src/app/api/stripe/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const SK = process.env.STRIPE_SECRET_KEY;
if (!SK) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment.");
}

// Do NOT pass apiVersion to avoid TS mismatches
const stripe = new Stripe(SK);

// Type guard: distinguish Customer vs DeletedCustomer
function isActiveCustomer(
  c: Stripe.Customer | Stripe.DeletedCustomer
): c is Stripe.Customer {
  return (c as Stripe.DeletedCustomer).deleted !== true;
}

/**
 * GET /api/stripe/session?id=cs_...   (also accepts ?session_id=)
 * Returns lightweight details about a Checkout Session.
 */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const id = sp.get("id") ?? sp.get("session_id");

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing query param ?id=cs_... (or ?session_id=)" },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ["line_items", "customer"],
    });

    // Prefer customer_details.email; otherwise, if expanded customer is not deleted, use its email
    const email =
      session.customer_details?.email ??
      (typeof session.customer === "object" && session.customer
        ? isActiveCustomer(session.customer)
          ? session.customer.email ?? undefined
          : undefined
        : undefined);

    const payload = {
      ok: true,
      id: session.id,
      mode: session.mode,
      status: session.payment_status,
      currency: session.currency,
      amount_total: session.amount_total,
      created_iso: new Date(session.created * 1000).toISOString(),
      email,
      line_items:
        session.line_items?.data.map((li) => ({
          id: li.id,
          description: li.description,
          quantity: li.quantity,
          amount_subtotal: li.amount_subtotal,
          amount_total: li.amount_total,
        })) ?? [],
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    const message =
      err?.raw?.message || err?.message || "Failed to retrieve session.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
