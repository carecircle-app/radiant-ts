"use client";
import { useState } from "react";

type Option = { label: string; sub: string; priceId: string; bg: string };

const options: Option[] = [
  {
    label: "CareCircle Lite $4.99/mo",
    sub: "50 cents/month supports CareCircle Global Foundation",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE ?? "",
    bg: "bg-blue-500"
  },
  {
    label: "CareCircle Elite $9.99/mo",
    sub: "$1/month supports CareCircle Global Foundation",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE ?? "",
    bg: "bg-green-500"
  },
  {
    label: "Donate Once",
    sub: "100% supports CareCircle Global Foundation",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_ONCE ?? "",
    bg: "bg-purple-500"
  },
  {
    label: "Donate Monthly",
    sub: "100% supports CareCircle Global Foundation",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_MONTHLY ?? "",
    bg: "bg-rose-500"
  }
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

  const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr", rowGap: 24 };
  const pillStyle: React.CSSProperties = {
    display: "block", width: "100%", minHeight: 64,
    lineHeight: 1.25, whiteSpace: "normal", wordBreak: "break-word",
    boxSizing: "border-box", position: "relative"
  };

  return (
    <div className="relative z-10 mx-auto max-w-3xl" style={{ isolation: "isolate" }}>
      <div style={gridStyle}>
        {options.map((opt) => (
          <div key={opt.label} className="flex flex-col items-stretch">
            <button
              onClick={() => startCheckout(opt.priceId)}
              disabled={!opt.priceId || busy === opt.priceId}
              className={`${opt.bg} rounded-full w-full px-6 py-4 text-center shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60`}
              style={pillStyle}
              aria-label={`${opt.label}  ${opt.sub}`}
            >
              <span className="block text-white font-semibold text-base">
                {busy === opt.priceId ? "Loading..." : opt.label}
              </span>
              <span className="block text-white/90 text-xs mt-1">
                {opt.sub}
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-xs text-slate-500" style={{ lineHeight: 1.4 }}>
        Test cards only  Powered by Stripe Checkout
      </div>
    </div>
  );
}