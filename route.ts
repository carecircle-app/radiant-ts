import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

function baseUrl(req: NextRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_BASE_URL;
  if (fromEnv?.startsWith('http')) return fromEnv.replace(/\/$/, '');
  const origin = req.headers.get('origin') || req.nextUrl.origin;
  return (origin || '').replace(/\/$/, '');
}

async function handle(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const priceId = searchParams.get('priceId');
  if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });

  const base = baseUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: ${base}/success?session_id={CHECKOUT_SESSION_ID},
    cancel_url: ${base}/cancel,
    allow_promotion_codes: true,
  });

  return NextResponse.redirect(session.url as string, { status: 303 });
}

export async function GET(req: NextRequest)  { try { return await handle(req); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
export async function POST(req: NextRequest) { try { return await handle(req); } catch (e:any) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
