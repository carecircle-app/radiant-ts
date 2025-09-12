export const metadata = { title: "Home  App Router" };

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Home (App Router)</h1>
      <p>If you see this, "/" is rendering from the App Router.</p>
    <section id="pricing" className="mx-auto max-w-3xl px-6 pb-16">
  <h2 className="text-center text-xl font-semibold text-gray-900">
    Choose Your Plan
  </h2>

  <div className="mt-6 space-y-6">
    <div className="w-full max-w-xl mx-auto">
      <a
        href="/api/stripe/checkout?plan=lite"
        className="block w-full rounded-full px-6 py-4 text-white font-semibold text-center shadow transition bg-blue-600 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        CareCircle Lite $4.99/mo
      </a>
      <p className="mt-2 text-center text-xs leading-snug text-gray-600">
        </main>.50/month from Lite supports CareCircle Global Foundation.
      </p>
    </div>

    <div className="w-full max-w-xl mx-auto">
      <a
        href="/api/stripe/checkout?plan=elite"
        className="block w-full rounded-full px-6 py-4 text-white font-semibold text-center shadow transition bg-green-600 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        CareCircle Elite $9.99/mo
      </a>
      <p className="mt-2 text-center text-xs leading-snug text-gray-600">
        $1/month from Elite supports CareCircle Global Foundation.
      </p>
    </div>

    <div className="w-full max-w-xl mx-auto">
      <a
        href="/api/stripe/checkout?plan=donate_once"
        className="block w-full rounded-full px-6 py-4 text-white font-semibold text-center shadow transition bg-violet-600 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Donate Once
      </a>
      <p className="mt-2 text-center text-xs leading-snug text-gray-600">
        100% of one-time donations support CareCircle Global Foundation.
      </p>
    </div>

    <div className="w-full max-w-xl mx-auto">
      <a
        href="/api/stripe/checkout?plan=donate_monthly"
        className="block w-full rounded-full px-6 py-4 text-white font-semibold text-center shadow transition bg-rose-600 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Donate Monthly
      </a>
      <p className="mt-2 text-center text-xs leading-snug text-gray-600">
        100% of monthly donations support CareCircle Global Foundation.
      </p>
    </div>
  </div>

  <p className="mt-6 text-center text-xs text-gray-500">
    Test cards only  Powered by Stripe Checkout
  </p>
</section>
</main>
  );
}

