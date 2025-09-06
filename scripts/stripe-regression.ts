// scripts/stripe-regression.ts
/**
 * Minimal end-to-end sanity check for your Stripe webhooks + Prisma writes.
 *
 * Preconditions:
 * 1) Dev server running (Next.js)
 * 2) Stripe CLI forwarding to your webhook:
 *    stripe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook
 *
 * Run:
 *    npx tsx scripts/stripe-regression.ts
 * or:
 *    npx ts-node scripts/stripe-regression.ts
 */

import { spawn } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// triggers that are safe with your current upserts
const TRIGGERS = [
  "customer.created",
  "customer.subscription.created",
  // You can add these later if you've enabled connectOrCreate for Invoice/Payment relations:
  // "invoice.paid",
  // "payment_intent.succeeded",
];

function run(cmd: string, args: string[], label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
    p.on("error", reject);
    p.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log("\n=== Stripe Webhook Regression ===\n");

  // Quick check: stripe CLI installed?
  try {
    await run("stripe", ["-v"], "stripe -v");
  } catch (e) {
    console.error("\n❌ Stripe CLI not found. Install it and ensure it's on PATH.");
    console.error("   https://stripe.com/docs/stripe-cli\n");
    process.exit(1);
  }

  console.log("⚡ Firing fixtures via Stripe CLI...");
  for (const t of TRIGGERS) {
    console.log(`→ stripe trigger ${t}`);
    await run("stripe", ["trigger", t], `stripe trigger ${t}`);
    // Give the webhook handler a moment to process & write to DB
    await new Promise((r) => setTimeout(r, 1200));
  }

  // Check DB for fresh rows
  const since = new Date(Date.now() - 10 * 60 * 1000); // last 10 minutes

  const [customers, subs, invoices, payments, events] = await Promise.all([
    prisma.customer.count({ where: { createdAt: { gte: since } } }),
    prisma.subscription.count({ where: { createdAt: { gte: since } } }),
    prisma.invoice.count({ where: { createdAt: { gte: since } } }),
    prisma.payment.count({ where: { createdAt: { gte: since } } }),
    prisma.event.count({ where: { createdAt: { gte: since } } }),
  ]);

  console.log("\n=== Results (last 10 min) ===");
  console.log(`Customers:     ${customers}`);
  console.log(`Subscriptions: ${subs}`);
  console.log(`Invoices:      ${invoices}`);
  console.log(`Payments:      ${payments}`);
  console.log(`Event audit:   ${events}`);

  // Minimal assertions based on the triggers we fired
  const passCustomers = customers > 0;
  const passSubs = subs > 0;

  const passed = passCustomers && passSubs;

  if (!passed) {
    console.error("\n❌ Regression FAILED.");
    if (!passCustomers) console.error(" - Expected at least 1 Customer");
    if (!passSubs) console.error(" - Expected at least 1 Subscription");
    console.error("\nTips:");
    console.error(" - Ensure `stripe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook` is running.");
    console.error(" - Watch terminal logs on your Next.js server for any 400/500 errors.");
    process.exit(2);
  }

  console.log("\n✅ Regression PASSED (customers & subscriptions present).");

  // Optional: enable these once you've added connectOrCreate to Invoice/Payment upserts.
  // if (invoices === 0) console.warn("⚠ No invoices inserted; add connectOrCreate in upsertInvoice to avoid FK races.");
  // if (payments === 0) console.warn("⚠ No payments inserted; ensure your webhook handles payment_intent.succeeded safely.");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("\nUnexpected error:", err?.message || err);
  await prisma.$disconnect();
  process.exit(1);
});
