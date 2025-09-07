// src/lib/stripe.ts
import 'server-only';
import Stripe from 'stripe';

const apiVersion: Stripe.LatestApiVersion = '2025-08-27.basil';

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? '',
  { apiVersion, appInfo: { name: 'CareCircle' } }
);

// tiny runtime guard for server routes only (optional)
export function assertServer() {
  if (typeof window !== 'undefined') {
    throw new Error('Stripe server helper used on the client.');
  }
}
