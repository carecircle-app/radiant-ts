"use client";
import { useState } from "react";

type Option = { label: string; sub?: string; priceId: string };

const options: Option[] = [
  {
    label: "CareCircle Lite $4.99/mo",
    sub: "50/month from Lite supports CareCircle Global Foundation.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE ?? ""
  },
  {
    label: "CareCircle Elite $9.99/mo",
    sub: "$1/month from Elite supports CareCircle Global Foundation.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE ?? ""
  },
  {
    label: "Donate Once",
    sub: "100% of one-time donations support CareCircle Global Foundation.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_ONCE ?? ""
  },
  {
    label: "Donate Monthly",
    sub: "100% of monthly donations support CareCircle Global Foundation.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_MONTHLY ?? ""
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

  return (
    <div className="relative z-10 mx-auto max-w-3xl isolate">
      {/* Force 1 item per row with reliable spacing */}
      <ul className="grid grid-cols-1 gap-y-6">
        {options.map((opt) => (
          <li key={opt.label} className="flex flex-col items-stretch">
            <button
              onClick={() => startCheckout(opt.priceId)}
              disabled={!opt.priceId || busy === opt.priceId}
              className="block w-full select-none rounded-full px-6 py-3 text-sm font-semibold shadow-md
                         focus:outline-none focus:ring-2 focus:ring-offset-2 transition disabled:opacity-60
                         leading-normal min-h-[44px]"
            >
              {busy === opt.priceId ? "Loading..." : opt.label}
            </button>
            {opt.sub ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-600 clear-both">
                {opt.sub}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-xs text-slate-500 leading-relaxed">
        Test cards only — Powered by Stripe Checkout
      </p>
    </div>
  );
}