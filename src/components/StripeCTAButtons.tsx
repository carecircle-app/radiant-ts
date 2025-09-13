"use client";
import { useState } from "react";

// Read price IDs at build-time from env (client-safe NEXT_PUBLIC_* vars)
const PRICE_LITE  = process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE || "";
const PRICE_ELITE = process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE || "";

async function startCheckout(priceId: string) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId })
  });
  if (!res.ok) throw new Error("Checkout failed: " + res.status);
  const data: { url?: string; error?: string } = await res.json();
  if (!data?.url) throw new Error(data?.error || "No URL from checkout");
  window.location.href = data.url;
}

function CtaLink(props: { label: string; priceId: string; busy: boolean; setBusy: (b: boolean)=>void }) {
  const { label, priceId, busy, setBusy } = props;
  const href = priceId ? `/api/stripe/checkout?priceId=${priceId}` : "#";
  return (
    <a
      href={href}
      onClick={async (e) => {
        if (!priceId) return; // nothing to do
        e.preventDefault();
        try { setBusy(true); await startCheckout(priceId); }
        catch (err) { console.error(err); window.location.href = href; } // GET fallback
        finally { setBusy(false); }
      }}
      aria-disabled={busy}
      className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium hover:underline disabled:opacity-50"
    >
      {busy ? "Starting" : label}
    </a>
  );
}

export default function StripeCTAButtons({ className }: { className?: string }) {
  const [liteBusy, setLiteBusy] = useState(false);
  const [eliteBusy, setEliteBusy] = useState(false);

  return (
    <div className={className ?? "mt-8 flex justify-center gap-3"}>
      <CtaLink label="Start Lite"  priceId={PRICE_LITE}  busy={liteBusy}  setBusy={setLiteBusy} />
      <CtaLink label="Go Elite"    priceId={PRICE_ELITE} busy={eliteBusy} setBusy={setEliteBusy} />
      <p className="sr-only">If checkout fails to start, links fall back to GET redirect.</p>
    </div>
  );
}