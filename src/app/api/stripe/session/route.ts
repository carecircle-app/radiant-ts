import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// GET /api/stripe/session?id=cs_test_...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ["payment_intent.charges", "invoice", "subscription"],
    });

    return NextResponse.json(session, { status: 200 });
  } catch (err) {
    console.error("session GET error", err);
    return NextResponse.json({ error: "Retrieve failed" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
