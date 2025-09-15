"use client";
import { useState } from "react";

async function startDonation(amountCents: number) {
  const res = await fetch("/api/stripe/donate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountCents }),
  });
  if (!res.ok) throw new Error("Donate failed: " + res.status);
  const data = (await res.json()) as { url?: string; error?: string };
  if (!data?.url) throw new Error(data?.error || "No URL from donate");
  window.location.href = data.url;
}

function Button({ amount, busy, setBusy }: { amount: number; busy: boolean; setBusy: (b: boolean)=>void }) {
  const dollars = (amount / 100).toFixed(0);
  return (
    <button
      onClick={async () => { try { setBusy(true); await startDonation(amount); } finally { setBusy(false); } }}
      aria-disabled={busy}
      className="btn btn-ghost"
    >
      {busy ? "Starting" : `$${dollars}`}
    </button>
  );
}

export default function DonationButtons() {
  const [b, setB] = useState(false);
  const [b2, setB2] = useState(false);
  const [b3, setB3] = useState(false);
  return (
    <div className="flex gap-3">
      <Button amount={500}  busy={b}  setBusy={setB}  />
      <Button amount={1000} busy={b2} setBusy={setB2} />
      <Button amount={2500} busy={b3} setBusy={setB3} />
    </div>
  );
}