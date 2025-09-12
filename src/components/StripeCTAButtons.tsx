/**
 * Colored Stripe CTAs + Foundation notes
 * - Uses NEXT_PUBLIC_* price IDs if present; falls back to test IDs in Preview.
 * - Server component (no "use client").
 */
export default function StripeCTAButtons() {
  const lite =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE_MONTHLY ||
    "price_1S3jjE07Y1VOtQQTGbpD36z4";
  const elite =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_MONTHLY ||
    "price_1S3laJ07Y1VOtQQTbQkTXlK6";
  const donateOnce =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATION_ONE_TIME ||
    "price_1S3ldL07Y1VOtQQTTW2BYwGT";
  const donateMonthly =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATION ||
    "price_1S2FwU07Y1VOtQQTOzcazKUp";

  return (
    <div className="mx-auto max-w-lg">
      <div className="space-y-3">

        {/* Lite */}
        <a
          href={`/api/stripe/checkout?priceId=${lite}`}
          aria-label="Subscribe to CareCircle Lite for $4.99 per month"
          className="block w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm sm:text-base font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          CareCircle Lite  $4.99/mo
        </a>
        <p className="mt-1 -mb-1 text-center text-xs text-slate-500">
          50¢/month from <span className="font-medium">Lite</span> supports CareCircle Global Foundation.
        </p>

        {/* Elite */}
        <a
          href={`/api/stripe/checkout?priceId=${elite}`}
          aria-label="Subscribe to CareCircle Elite for $9.99 per month"
          className="block w-full rounded-full bg-green-600 hover:bg-green-700 text-white py-3 text-sm sm:text-base font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          CareCircle Elite  $9.99/mo
        </a>
        <p className="mt-1 -mb-1 text-center text-xs text-slate-500">
          $1/month from <span className="font-medium">Elite</span> supports CareCircle Global Foundation.
        </p>

        {/* Donate Once */}
        <a
          href={`/api/stripe/checkout?priceId=${donateOnce}`}
          aria-label="Donate once to CareCircle"
          className="block w-full rounded-full bg-violet-600 hover:bg-violet-700 text-white py-3 text-sm sm:text-base font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          Donate Once
        </a>
        <p className="mt-1 -mb-1 text-center text-xs text-slate-500">
          100% of one-time donations support CareCircle Global Foundation.
        </p>

        {/* Donate Monthly */}
        <a
          href={`/api/stripe/checkout?priceId=${donateMonthly}`}
          aria-label="Donate monthly to CareCircle"
          className="block w-full rounded-full bg-rose-600 hover:bg-rose-700 text-white py-3 text-sm sm:text-base font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          Donate Monthly
        </a>
        <p className="mt-1 text-center text-xs text-slate-500">
          100% of monthly donations support CareCircle Global Foundation.
        </p>

      </div>
    </div>
  );
}
