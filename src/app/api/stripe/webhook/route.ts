import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { seenOncePersist } from "@/lib/eventStore";

import {
  appendEventLine,
  upsertSubscription,
  upsertPayment,
  upsertInvoice,
  upsertCustomer,
  upsertPrice,
  upsertProduct,
  upsertCharge,
} from "@/lib/webhookStore";

import {
  sendEmail,
  tmplPaymentSucceeded,
  tmplInvoiceFailed,
  tmplSubscriptionChanged,
} from "@/lib/mailer";

import {
  sendSlack,
  slackPaymentSucceeded,
  slackInvoiceFailed,
  slackSubscriptionChanged,
} from "@/lib/slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Stripe client (no pinned apiVersion to avoid TS drift) */
const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || "").trim();
if (!STRIPE_SECRET_KEY.startsWith("sk_")) {
  throw new Error("STRIPE_SECRET_KEY missing/invalid");
}
const stripe = new Stripe(STRIPE_SECRET_KEY);

/* ---------- Tiny TS compat helpers across Stripe versions ---------- */
type SubscriptionCompat = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
};

type InvoiceCompat = Stripe.Invoice & {
  subscription?: string | { id: string } | null;
};

const asSub = (x: unknown) => x as SubscriptionCompat;
const asInv = (x: unknown) => x as InvoiceCompat;

const num = (v: unknown): number | undefined =>
  typeof v === "number" ? v : undefined;

const strOrId = (v: unknown): string | null => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "id" in (v as any) && typeof (v as any).id === "string") {
    return (v as any).id;
  }
  return null;
};

/* =================================================================== */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const WH_SECRET = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();

  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  if (!WH_SECRET.startsWith("whsec_")) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const raw = await req.text(); // raw body needed for signature
    event = stripe.webhooks.constructEvent(raw, sig, WH_SECRET);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${err?.message || "invalid"}` },
      { status: 400 }
    );
  }

  // de-dup
  if (await seenOncePersist(event.id, event.type)) {
    return NextResponse.json({ received: true, dedup: true }, { status: 200 });
  }

  try {
    // best-effort audit trail
    try {
      await appendEventLine(event.type, event.data.object);
    } catch (e) {
      console.warn("[webhook] appendEventLine skipped:", (e as any)?.message);
    }

    switch (event.type) {
      /* =================== CHECKOUT â†’ SUBSCRIPTION =================== */
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;

        if (s.mode === "subscription" && s.subscription) {
          const subId = typeof s.subscription === "string" ? s.subscription : s.subscription.id;

          const subResp = await stripe.subscriptions.retrieve(subId, {
            expand: ["items.data.price.product", "latest_invoice.payment_intent"],
          });
          const sub = asSub(subResp);

          const firstItem = sub.items?.data?.[0];
          const price = firstItem?.price;

          await upsertSubscription({
            id: sub.id,
            status: sub.status,
            customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
            priceId: price?.id ?? null,
            planAmount: price?.unit_amount ?? null,
            currency: price?.currency ?? null,
            currentPeriodStart: num(sub.current_period_start) ?? null,
            currentPeriodEnd: num(sub.current_period_end) ?? null,
          });

          try {
            await sendEmail(
              tmplSubscriptionChanged({
                subId: sub.id,
                status: sub.status,
                customer:
                  typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
              })
            );
          } catch (e) {
            console.warn("[email] subscription create skipped:", (e as any)?.message);
          }
          try {
            await sendSlack(
              slackSubscriptionChanged({
                subId: sub.id,
                status: sub.status,
                customer:
                  typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
              })
            );
          } catch (e) {
            console.warn("[slack] subscription create skipped:", (e as any)?.message);
          }
        }
        break;
      }

      /* =================== SUBSCRIPTION LIFECYCLE ==================== */
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = asSub(event.data.object);

        const firstItem = sub.items?.data?.[0];
        const price = firstItem?.price;

        await upsertSubscription({
          id: sub.id,
          status: sub.status,
          customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
          priceId: price?.id ?? null,
          planAmount: price?.unit_amount ?? null,
          currency: price?.currency ?? null,
          currentPeriodStart: num(sub.current_period_start) ?? null,
          currentPeriodEnd: num(sub.current_period_end) ?? null,
        });

        try {
          await sendEmail(
            tmplSubscriptionChanged({
              subId: sub.id,
              status: sub.status,
              customer:
                typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
            })
          );
        } catch (e) {
          console.warn("[email] subscription change skipped:", (e as any)?.message);
        }
        try {
          await sendSlack(
            slackSubscriptionChanged({
              subId: sub.id,
              status: sub.status,
              customer:
                typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
            })
          );
        } catch (e) {
          console.warn("[slack] subscription change skipped:", (e as any)?.message);
        }
        break;
      }

      /* ====================== PAYMENTS / CHARGES ===================== */
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;

        await upsertPayment({
          id: String(pi.id),
          amount: Number(pi.amount),
          currency: String(pi.currency),
          status: pi.status,
          customerId: typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null,
          email: pi.receipt_email ?? null,
          created: Number(pi.created),
        });

        try {
          await sendEmail(
            tmplPaymentSucceeded({
              amount: pi.amount,
              currency: pi.currency,
              piId: pi.id,
              customer: typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null,
              email: pi.receipt_email ?? null,
            })
          );
        } catch (e) {
          console.warn("[email] payment success skipped:", (e as any)?.message);
        }
        try {
          await sendSlack(
            slackPaymentSucceeded({
              amount: pi.amount,
              currency: pi.currency,
              piId: pi.id,
              customer: typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null,
              email: pi.receipt_email ?? null,
            })
          );
        } catch (e) {
          console.warn("[slack] payment success skipped:", (e as any)?.message);
        }
        break;
      }

      case "charge.succeeded":
      case "charge.updated": {
        const ch = event.data.object as Stripe.Charge;
        await upsertCharge({
          id: String(ch.id),
          amount: Number(ch.amount),
          currency: String(ch.currency),
          status: ch.status,
          payment_intent:
            typeof ch.payment_intent === "string"
              ? ch.payment_intent
              : ((ch.payment_intent as any) ?? null),
          customer: typeof ch.customer === "string" ? ch.customer : ch.customer?.id ?? null,
        });
        break;
      }

      /* =========================== INVOICES ========================== */
      case "invoice.paid":
      case "invoice.finalized":
      case "invoice.payment_failed":
      case "invoice.updated": {
        const inv = asInv(event.data.object);

        const subscriptionId = strOrId(inv.subscription);

        await upsertInvoice({
          id: String(inv.id),
          subscriptionId,
          amountPaid: typeof inv.amount_paid === "number" ? inv.amount_paid : null,
          amountDue: typeof inv.amount_due === "number" ? inv.amount_due : null,
          currency: inv.currency ?? null,
          status: inv.status ?? null,
          customerId:
            typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? null,
          hostedUrl: inv.hosted_invoice_url ?? null,
        });

        if (event.type === "invoice.payment_failed") {
          try {
            await sendEmail(
              tmplInvoiceFailed({
                invoiceId: String(inv.id ?? "unknown-invoice"),
                amountDue: typeof inv.amount_due === "number" ? inv.amount_due : null,
                currency: inv.currency ?? null,
                customer:
                  typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? null,
                hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
              })
            );
          } catch (e) {
            console.warn("[email] invoice failed skipped:", (e as any)?.message);
          }
          try {
            await sendSlack(
              slackInvoiceFailed({
                invoiceId: String(inv.id ?? "unknown-invoice"),
                amountDue: typeof inv.amount_due === "number" ? inv.amount_due : null,
                currency: inv.currency ?? null,
                customer:
                  typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? null,
                hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
              })
            );
          } catch (e) {
            console.warn("[slack] invoice failed skipped:", (e as any)?.message);
          }
        }
        break;
      }

      /* ==================== CATALOG / CUSTOMERS ====================== */
      case "price.created":
      case "price.updated": {
        const price = event.data.object as Stripe.Price;
        await upsertPrice({
          id: String(price.id),
          product: typeof price.product === "string" ? price.product : price.product?.id ?? null,
          active: !!price.active,
          unit_amount: price.unit_amount ?? null,
          currency: price.currency ?? null,
          interval: (price.recurring as any)?.interval ?? null,
          nickname: price.nickname ?? null,
        });
        break;
      }

      case "product.created":
      case "product.updated": {
        const product = event.data.object as Stripe.Product;
        await upsertProduct({
          id: String(product.id),
          name: product.name ?? null,
          active: !!product.active,
        });
        break;
      }

      case "customer.created":
      case "customer.updated": {
        const c = event.data.object as Stripe.Customer;
        await upsertCustomer({
          id: String(c.id),
          email: c.email ?? null,
          name: c.name ?? null,
        });
        break;
      }

      case "customer.deleted": {
        const raw = event.data.object as Stripe.Customer | Stripe.DeletedCustomer;
        const deleted = (raw as Stripe.DeletedCustomer).deleted === true;
        await upsertCustomer({
          id: String(raw.id),
          deleted,
        });
        break;
      }

      default:
        // Ack everything so Stripe doesnâ€™t retry forever
        break;
    }

    return new NextResponse("ok", { status: 200, headers: { "Stripe-Event-Id": event.id } });
  } catch (err: any) {
    console.error("[webhook] handler error:", err?.message || err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

/** Simple probe */
export function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
