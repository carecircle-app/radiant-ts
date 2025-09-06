"use client";

type Props = {
  customerId?: string; // if you know the Stripe customer
  sessionId?: string;  // or pass the Checkout Session from the success page
};

export function ManageSubscriptionButton({ customerId, sessionId }: Props) {
  const canSubmit = Boolean(customerId || sessionId);

  async function openPortal() {
    const body =
      customerId ? { customer_id: customerId } : { session_id: sessionId };

    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error || "Could not open portal.");
  }

  return (
    <button
      onClick={openPortal}
      disabled={!canSubmit}
      className="rounded-md px-4 py-2 bg-black text-white disabled:opacity-50"
      title={!canSubmit ? "Need a customerId or sessionId" : "Open Billing Portal"}
    >
      Manage subscription
    </button>
  );
}
