import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY ?? "";

export const stripe = new Stripe(key, {
  // omit apiVersion to use the SDK's default (avoids type mismatch on updates)
  appInfo: { name: "CareCircle" },
});

// tiny runtime guard for server routes only (optional)
export function assertServer() {
  if (typeof window !== "undefined") {
    throw new Error("Stripe server helper used on the client.");
  }
}
