"use client";
import { useState } from "react";

type Option = { label: string; sub?: string; priceId: string };

const options: Option[] = [
  { label: "CareCircle Lite $4.99/mo",  sub: "50/month from Lite supports CareCircle Global Foundation.",   priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE ?? "" },
  { label: "CareCircle Elite $9.99/mo", sub: "$1/month from Elite supports CareCircle Global Foundation.",    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE ?? "" },
  { label: "Donate Once",               sub: "100% of one-time donations support CareCircle Global Foundation.", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_ONCE ?? "" },
  { label: "Donate Monthly",            sub: "100% of monthly donations support CareCircle Global Foundation.",  priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_MONTHLY ?? "" }
];

export default function StripeCTAButtons() {
  const [busy, setBusy] = useState<string | null>(null);

  async function startCheckout(priceId: string) {
    if (!priceId || busy) return;
    setBusy(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId })
      });
      const data = await res.json();
      if (data?.url) window.location.href = data.url as string;
    } catch (err) {
      console.error("Checkout error", err);
      alert("Could not start checkout. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  // Shared inline styles (inline ensures we override any legacy global styles)
  const pill: React.CSSProperties = {
    display: "block",
    width: "100%",
    minHeight: 44,
    lineHeight: "1.25rem",
    whiteSpace: "normal",
    wordBreak: "break-word",
    boxSizing: "border-box",
    position: "relative",

    // Visuals to match your screenshot:
    backgroundColor: "#ffffff",
    color: "#111827",                 // slate-900
    borderRadius: 9999,               // rounded-full
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
  };

  const caption: React.CSSProperties = {
    marginTop: 8,
    lineHeight: 1.625,
    color: "#64748b",                 // slate-500/600
    display: "block",
    position: "relative",
    clear: "both"
  };

  return (
    <div className="relative z-10 mx-auto max-w-3xl" style={{ isolation: "isolate" }}>
      {/* hard single-column list */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", rowGap: "24px" }}>
        {options.map((opt) => (
          <div key={opt.label} style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
            <button
              onClick={() => startCheckout(opt.priceId)}
              disabled={!opt.priceId || busy === opt.priceId}
              className="select-none px-6 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
              style={pill}
            >
              {busy === opt.priceId ? "Loading..." : opt.label}
            </button>
            {opt.sub ? <div style={caption}>{opt.sub}</div> : null}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-xs" style={{ color: "#64748b", lineHeight: 1.4 }}>
        Test cards only  Powered by Stripe Checkout
      </div>
    </div>
  );
}