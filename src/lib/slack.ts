// src/lib/slack.ts
/**
 * Lightweight Slack webhook helper.
 * - Uses global fetch (no deps)
 * - Soft-fails if SLACK_WEBHOOK_URL is missing (won’t crash dev)
 * - Exposes: sendSlack(), slackPaymentSucceeded(), slackInvoiceFailed(), slackSubscriptionChanged()
 */

const WEBHOOK = (process.env.SLACK_WEBHOOK_URL || "").trim();

export type SlackPayload = {
  text: string;
  blocks?: any[]; // Slack Block Kit
};

export type SlackResult =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; status: number }
  | { skipped: true };

/** Low-level sender */
export async function sendSlack(payload: SlackPayload): Promise<SlackResult> {
  if (!WEBHOOK) {
    console.warn("[slack] Skipped — SLACK_WEBHOOK_URL not set.");
    return { skipped: true };
  }
  try {
    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("[slack] Webhook returned non-200:", res.status, body);
      return { ok: false, status: res.status };
    }
    return { ok: true };
  } catch (err: any) {
    console.warn("[slack] Send failed:", err?.message || String(err));
    return { ok: false, error: err?.message || String(err) };
  }
}

/* ---------------- Formatting helpers ---------------- */

function money(amount?: number | null, currency?: string | null): string {
  if (amount == null || !currency) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency?.toUpperCase() || ""}`;
  }
}

/** ✅ Payment succeeded */
export function slackPaymentSucceeded(p: {
  amount: number;
  currency: string;
  piId: string;
  customer?: string | null;
  email?: string | null;
}): SlackPayload {
  const amt = money(p.amount, p.currency);
  return {
    text: `✅ Payment succeeded — ${amt}`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: "✅ Payment Succeeded" } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Amount:*\n${amt}` },
          { type: "mrkdwn", text: `*PI:*\n${p.piId}` },
          { type: "mrkdwn", text: `*Customer:*\n${p.customer ?? "—"}` },
          { type: "mrkdwn", text: `*Email:*\n${p.email ?? "—"}` },
        ],
      },
    ],
  };
}

/** ⚠️ Invoice payment failed */
export function slackInvoiceFailed(p: {
  invoiceId: string;
  amountDue?: number | null;
  currency?: string | null;
  customer?: string | null;
  hostedInvoiceUrl?: string | null;
}): SlackPayload {
  const amt = money(p.amountDue ?? null, p.currency ?? null);
  const linkBlock = p.hostedInvoiceUrl
    ? [
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Open invoice ↗" },
              url: p.hostedInvoiceUrl,
            },
          ],
        },
      ]
    : [];

  return {
    text: `⚠️ Invoice payment failed — ${amt} (${p.invoiceId})`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: "⚠️ Invoice Payment Failed" } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Invoice:*\n${p.invoiceId}` },
          { type: "mrkdwn", text: `*Customer:*\n${p.customer ?? "—"}` },
          { type: "mrkdwn", text: `*Amount Due:*\n${amt}` },
        ],
      },
      ...linkBlock,
    ],
  };
}

/** 🔄 Subscription changed */
export function slackSubscriptionChanged(p: {
  subId: string;
  status: string;
  customer?: string | null;
}): SlackPayload {
  return {
    text: `🔄 Subscription ${p.subId} — ${p.status}`,
    blocks: [
      { type: "header", text: { type: "plain_text", text: "🔄 Subscription Changed" } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*ID:*\n${p.subId}` },
          { type: "mrkdwn", text: `*Status:*\n${p.status}` },
          { type: "mrkdwn", text: `*Customer:*\n${p.customer ?? "—"}` },
        ],
      },
    ],
  };
}
