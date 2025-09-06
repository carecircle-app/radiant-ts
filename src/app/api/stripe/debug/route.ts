// src/app/api/stripe/debug/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

/**
 * Minimal, version-agnostic debug endpoint.
 * - Avoids hard-coding apiVersion (fixes the TS mismatch error).
 * - Verifies the key and returns a tiny health payload.
 */
export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key || key.trim() === '' || key.includes('sk_test_...')) {
    return NextResponse.json(
      { ok: false, error: 'Missing or placeholder STRIPE_SECRET_KEY' },
      { status: 500 }
    );
  }

  try {
    // No apiVersion passed here (prevents the type error you saw).
    const stripe = new Stripe(key);

    // Lightweight call to ensure the key works (no PII returned)
    const balance = await stripe.balance.retrieve();

    return NextResponse.json({
      ok: true,
      liveMode: balance.livemode ?? false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Stripe check failed' },
      { status: 500 }
    );
  }
}

