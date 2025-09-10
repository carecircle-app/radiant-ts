import { getPriceId, SUPPORTED_CURRENCIES } from "@/lib/pricing";

export default function AdminPricingPage() {
  const lite = getPriceId("lite");
  const elite = getPriceId("elite");
  const donateOne = getPriceId("donation");
  const donateMonthly = getPriceId("donationMonthly");

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Admin  Pricing</h1>
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div><dt className="font-medium">Lite</dt><dd className="text-gray-600 break-all">{lite || "— not set —"}</dd></div>
        <div><dt className="font-medium">Elite</dt><dd className="text-gray-600 break-all">{elite || "— not set —"}</dd></div>
        <div><dt className="font-medium">Donation (one-time)</dt><dd className="text-gray-600 break-all">{donateOne || " not set "}</dd></div>
        <div><dt className="font-medium">Donation (monthly)</dt><dd className="text-gray-600 break-all">{donateMonthly || " not set "}</dd></div>
      </dl>
      <p className="mt-6 text-xs text-gray-500">
        Supported currencies: {SUPPORTED_CURRENCIES.join(", ")}
      </p>
    </main>
  );
}
