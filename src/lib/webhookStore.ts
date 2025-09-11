/* eslint-disable @typescript-eslint/no-explicit-any */

// src/lib/webhookStore.ts

// Use ONE of these lines (not both). If your tsconfig maps "@/*" -> "src/*", keep the alias:
import { prisma } from "@/lib/db";
// import { prisma } from "./db";

/* =========================
   Input types (match schema)
   ========================= */
export type UpsertCustomerInput = {
  id: string;
  email?: string | null;
  name?: string | null;
  deleted?: boolean;
};

export type UpsertSubscriptionInput = {
  id: string;
  status: string;
  customerId: string | null; // required in schema (FK), Stripe provides this
  priceId?: string | null;
  planAmount?: number | null;
  currency?: string | null;
  currentPeriodStart?: number | null | undefined; // epoch seconds
  currentPeriodEnd?: number | null | undefined;   // epoch seconds
};

export type UpsertInvoiceInput = {
  id: string;
  subscriptionId?: string | null;
  amountPaid?: number | null;
  amountDue?: number | null;
  currency?: string | null;
  status?: string | null;
  hostedUrl?: string | null;
  customerId?: string | null;
  created?: number | undefined; // epoch seconds (optional)
};

export type UpsertPaymentInput = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customerId?: string | null;
  email?: string | null;
  created: number; // epoch seconds
};

/* ================
   Event audit log
   ================ */
export async function appendEventLine(type: string, payload: unknown) {
  try {
    await prisma.event.create({
      data: {
        id: `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        type,
        payload: payload as any,
      },
    });
  } catch {
    // ignore audit-log failures
  }
}

/* ===============
   Customers
   =============== */
export async function upsertCustomer(input: UpsertCustomerInput) {
  await prisma.customer.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      email: input.email ?? null,
      name: input.name ?? null,
      deleted: input.deleted ?? false,
    },
    update: {
      email: input.email ?? null,
      name: input.name ?? null,
      // only update deleted if caller sent it; otherwise leave as-is
      deleted: input.deleted ?? undefined,
    },
  });
}

/* =================
   Subscriptions
   =================
   FK customerId is required. To survive out-of-order webhooks,
   ensure the Customer row exists in the same transaction.
*/
export async function upsertSubscription(input: UpsertSubscriptionInput) {
  if (!input.customerId) return; // cannot proceed without a customer

  await prisma.$transaction(async (tx) => {
    // minimal stub so the FK can connect if customer isn't upserted yet
    await tx.customer.upsert({
      where: { id: input.customerId! },
      create: { id: input.customerId! },
      update: {},
    });

    await tx.subscription.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        status: input.status,
        customerId: input.customerId!,
        priceId: input.priceId ?? null,
        planAmount: input.planAmount ?? null,
        currency: input.currency ?? null,
        currentPeriodStart:
          typeof input.currentPeriodStart === "number"
            ? input.currentPeriodStart
            : null,
        currentPeriodEnd:
          typeof input.currentPeriodEnd === "number"
            ? input.currentPeriodEnd
            : null,
      },
      update: {
        status: input.status,
        // keep FK stable unless you *intend* to move ownership
        // customerId: input.customerId!,
        priceId: input.priceId ?? null,
        planAmount: input.planAmount ?? null,
        currency: input.currency ?? null,
        currentPeriodStart:
          typeof input.currentPeriodStart === "number"
            ? input.currentPeriodStart
            : null,
        currentPeriodEnd:
          typeof input.currentPeriodEnd === "number"
            ? input.currentPeriodEnd
            : null,
      },
    });
  });
}

/* =========
   Invoices
   =========
   Use scalar FKs (subscriptionId, customerId). This avoids the
   union-type errors you hit with nested relation objects.
*/
export async function upsertInvoice(input: UpsertInvoiceInput) {
  await prisma.invoice.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      subscriptionId: input.subscriptionId ?? null,
      amountPaid: input.amountPaid ?? null,
      amountDue: input.amountDue ?? null,
      currency: input.currency ?? null,
      status: input.status ?? null,
      hostedUrl: input.hostedUrl ?? null,
      customerId: input.customerId ?? null,
      // createdAt has a default; only set if Stripe gave us a timestamp
      ...(typeof input.created === "number"
        ? { createdAt: new Date(input.created * 1000) }
        : {}),
    },
    update: {
      subscriptionId: input.subscriptionId ?? undefined,
      amountPaid: input.amountPaid ?? undefined,
      amountDue: input.amountDue ?? undefined,
      currency: input.currency ?? undefined,
      status: input.status ?? undefined,
      hostedUrl: input.hostedUrl ?? undefined,
      customerId: input.customerId ?? undefined,
    },
  });
}

/* =========
   Payments
   ========= */
export async function upsertPayment(input: UpsertPaymentInput) {
  await prisma.payment.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      amount: input.amount,
      currency: input.currency,
      status: input.status,
      customerId: input.customerId ?? null,
      email: input.email ?? null,
      createdAt: new Date(input.created * 1000),
    },
    update: {
      amount: input.amount,
      currency: input.currency,
      status: input.status,
      customerId: input.customerId ?? undefined,
      email: input.email ?? undefined,
    },
  });
}

/* ==================================
   No-op placeholders (no such tables)
   ================================== */
export async function upsertPrice(_input: any) {
  /* no Price table in your schema */
}
export async function upsertProduct(_input: any) {
  /* no Product table in your schema */
}
export async function upsertCharge(_input: any) {
  /* no Charge table in your schema */
}
