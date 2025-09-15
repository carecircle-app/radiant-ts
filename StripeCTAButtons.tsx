"use client";

export default function StripeCTAButtons() {
  const lite  = process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE || (process.env.STRIPE_PRICE_LITE as string) || "";
  const elite = process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE || (process.env.STRIPE_PRICE_ELITE as string) || "";

  const liteHref  = `/api/stripe/checkout?priceId=${encodeURIComponent(lite)}`;
  const eliteHref = `/api/stripe/checkout?priceId=${encodeURIComponent(elite)}`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <a href={liteHref}  className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium hover:underline">Start Lite</a>
      <a href={eliteHref} className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium hover:underline">Go Elite</a>
    </div>
  );
}
