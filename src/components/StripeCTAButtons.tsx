import Link from "next/link";
import { STRIPE_ENV } from "@/lib/stripeEnv";

export default function StripeCTAButtons() {
  const { lite, elite, donateOne, donateMonthly } = STRIPE_ENV;

  const items: Array<{label:string; id?: string}> = [
    { label: "Start Lite", id: lite },
    { label: "Go Elite", id: elite },
  ];

  return (
    <div className="flex items-center gap-3">
      {items.map(({label, id}) =>
        id ? (
          <Link key={label} href={`/api/stripe/checkout?priceId=${id}`} className="btn btn-primary">
            {label}
          </Link>
        ) : (
          <button key={label} className="btn btn-ghost opacity-50 cursor-not-allowed" title="Price not configured">
            {label}
          </button>
        )
      )}

      {/* Foundation / Donations */}
      {donateOne ? (
        <Link href={`/api/stripe/checkout?priceId=${donateOne}`} className="btn btn-ghost">Donate $1.50 one-time</Link>
      ) : (
        <button className="btn btn-ghost opacity-50 cursor-not-allowed" title="Donation one-time not configured">Donate $1.50 one-time</button>
      )}

      {donateMonthly ? (
        <Link href={`/api/stripe/checkout?priceId=${donateMonthly}`} className="btn btn-ghost">Donate $1.50 / month</Link>
      ) : (
        <button className="btn btn-ghost opacity-50 cursor-not-allowed" title="Donation monthly not configured">Donate $1.50 / month</button>
      )}
    </div>
  );
}
