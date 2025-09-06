'use client';

import React from 'react';

type PlanKey = 'lite' | 'elite' | 'donation' | 'donation-monthly';

async function runCheckout(plan: PlanKey) {
  const res = await fetch(`/api/stripe/checkout?plan=${encodeURIComponent(plan)}`, {
    method: 'POST',
  });

  const data = await res.json().catch(() => ({} as any));

  if (!res.ok) {
    console.error('Checkout error:', data);
    alert(data?.error || 'Checkout failed. See console for details.');
    return;
  }

  const url = typeof data?.url === 'string' ? data.url : undefined;

  if (url) {
    // Navigate in the same tab (more reliable than window.open)
    window.location.assign(url);
    // Tiny fallback in case navigation stalls
    setTimeout(() => {
      if (location.href !== url) location.href = url;
    }, 250);
    return;
  }

  console.error('No URL returned from /api/stripe/checkout:', data);
  alert('No checkout URL returned from server.');
}

export default function StripeCTAButtons() {
  const [busy, setBusy] = React.useState<PlanKey | null>(null);

  const click = (plan: PlanKey) => async () => {
    if (busy) return; // prevent double-clicks
    setBusy(plan);
    try {
      await runCheckout(plan);
    } finally {
      setBusy(null);
    }
  };

  const is = (p: PlanKey) => busy === p;

  return (
    <div className="mx-auto max-w-md w-full flex flex-col gap-3 p-4">
      <button
        onClick={click('lite')}
        disabled={is('lite')}
        className="rounded-2xl px-4 py-3 shadow-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
      >
        CareCircle Lite — $4.99/mo
      </button>

      <button
        onClick={click('elite')}
        disabled={is('elite')}
        className="rounded-2xl px-4 py-3 shadow-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
      >
        CareCircle Elite — $9.99/mo
      </button>

      <button
        onClick={click('donation')}
        disabled={is('donation')}
        className="rounded-2xl px-4 py-3 shadow-sm bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
      >
        Donate Once
      </button>

      <button
        onClick={click('donation-monthly')}
        disabled={is('donation-monthly')}
        className="rounded-2xl px-4 py-3 shadow-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
      >
        Donate Monthly
      </button>

      <p className="text-center text-xs opacity-70 mt-1">
        Test cards only · Powered by Stripe Checkout
      </p>
    </div>
  );
}
