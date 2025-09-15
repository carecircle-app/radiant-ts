import FeatureBoxes from "@/components/FeatureBoxes";
import { PRICES } from "@/lib/prices";
import { PLAN_FEATURES } from "@/lib/planFeatures";


function LogoCareCircle({ className = "h-14 w-14" }: { className?: string }) {
  const teal = "#0F9B93"; const sky = "#38BDF8";
  return (
    <svg className={className} viewBox="0 0 120 120" role="img" aria-label="CareCircle">
      <circle cx="60" cy="60" r="54" fill="none" stroke={sky} strokeWidth="12" />
      <g transform="translate(12,12) scale(0.82)">
        <path d="M60 95 L32 67 C20 55 20 36 32 24 c12-12 31-12 43 0" fill="none" stroke={teal} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M60 95 L88 67 c12-12 12-31 0-43 c-12-12-31-12-43 0" fill="none" stroke={sky} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
export default function Home() {
  return (
    <>
      {/* header + hero + FeatureBoxes + footer, all your JSX */}
      <FeatureBoxes />
    </>
  );
}

const env = {
  lite: process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE || "",
  elite: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE || "",
  donateOnce: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_ONETIME || "",
  donateMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_MONTHLY || "",
};

export default function Home() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white px-3 py-2 rounded-md shadow">Skip to content</a>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2" aria-label="CareCircle Home">
            <LogoCareCircle />
            <div className="leading-tight text-slate-900">
              <div className="font-bold tracking-tight">CareCircle</div>
              <div className="font-bold tracking-tight -mt-0.5 text-center">App</div>
            </div>
          </a>
          <nav className="hidden sm:flex gap-6 text-sm text-slate-700">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#who" className="hover:text-slate-900">Who we are</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#foundation" className="hover:text-slate-900">Foundation</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </nav>
          <a href="#pricing" className="hidden sm:inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
            View pricing
          </a>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="relative bg-gradient-to-b from-emerald-50 via-sky-50 to-white">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <p className="text-xs uppercase tracking-widest text-emerald-700/80">Welcome</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">Coordinate care with confidence</h1>
            <p className="mt-4 text-slate-600 md:text-lg">
              Shared calendar, medication reminders, geofencing alerts, and secure chat — built for families and caregivers.
            </p>

            {/* Small plan CTAs (no tall bars) */}
            <div className="mt-8 flex justify-center gap-3">
              <a
                href={env.lite ? "/api/stripe/checkout?priceId=" + env.lite : "#pricing"}
                aria-disabled={!env.lite}
                className={"inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition " +
                  "bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 " +
                  (!env.lite ? "pointer-events-none opacity-50" : "")}
              >Start Lite</a>
              <a
                href={env.elite ? "/api/stripe/checkout?priceId=" + env.elite : "#pricing"}
                aria-disabled={!env.elite}
                className={"inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition " +
                  "bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 " +
                  (!env.elite ? "pointer-events-none opacity-50" : "")}
              >Go Elite</a>
            </div>

            <p className="mt-4 text-xs text-slate-500">Test cards only • Powered by Stripe Checkout</p>

            {/* Trust bar */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500">
              <div className="rounded-2xl border border-slate-200 p-3 bg-white shadow-sm">Privacy-first design</div>
              <div className="rounded-2xl border border-slate-200 p-3 bg-white shadow-sm">Stripe payments</div>
              <div className="rounded-2xl border border-slate-200 p-3 bg-white shadow-sm">99.9% uptime target</div>
              <div className="rounded-2xl border border-slate-200 p-3 bg-white shadow-sm">Encrypted in transit (TLS)</div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-10">
          <FeatureBoxes />
        </section>

        {/* Who we are */}
        <section id="who" className="mx-auto max-w-6xl px-6 pb-16">
          <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold">Who we are</h2>
            <p className="mt-2 text-slate-600">
              CareCircle is a tiny team focused on reducing the stress of coordinating care across families and caregivers.
            </p>
          </div>
        </section>

        {/* Pricing (drawer contains the cards; buttons remain small) */}
        <section id="pricing" className="mx-auto max-w-6xl px-6 pb-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Pick a plan that fits</h2>
            <p className="mt-2 text-slate-600">Transparent pricing. Cancel anytime.</p>

            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex gap-3">
                <a href={env.lite ? "/api/stripe/checkout?priceId=" + env.lite : "#pricing"} className={"inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 " + (!env.lite ? "pointer-events-none opacity-50" : "")}>Start Lite</a>
                <a href={env.elite ? "/api/stripe/checkout?priceId=" + env.elite : "#pricing"} className={"inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 " + (!env.elite ? "pointer-events-none opacity-50" : "")}>Go Elite</a>
              </div>

              <details className="w-full md:w-auto">
                <summary className="list-none cursor-pointer inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  See pricing details
                </summary>

                <div className="mt-6 grid gap-6 md:grid-cols-3 text-left">
                  {/* Free */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold">Free</h3>
                    <p className="mt-1 text-sm text-slate-600">$0.00 / month</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      {PLAN_FEATURES.free.map((t, i) => (<li key={i}>{t.text}</li>))}
                    </ul>
                    <a href="/pricing" className="mt-5 inline-flex w-full justify-center rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                      See full details
                    </a>
                  </div>

                  {/* Lite */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold">Lite</h3>
                    <p className="mt-1 text-sm text-slate-600">{PRICES.lite}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      {PLAN_FEATURES.lite.map((t, i) => (<li key={i}>{t.text}</li>))}
                    </ul>
                    <a href={env.lite ? "/api/stripe/checkout?priceId=" + env.lite : "#pricing"} className={"mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 " + (!env.lite ? "pointer-events-none opacity-50" : "")}>
                      Start Lite
                    </a>
                  </div>

                  {/* Elite */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold">Elite</h3>
                    <p className="mt-1 text-sm text-slate-600">{PRICES.elite}</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      {PLAN_FEATURES.elite.map((t, i) => (<li key={i}>{t.text}</li>))}
                    </ul>
                    <a href={env.elite ? "/api/stripe/checkout?priceId=" + env.elite : "#pricing"} className={"mt-5 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 " + (!env.elite ? "pointer-events-none opacity-50" : "")}>
                      Go Elite
                    </a>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Foundation + donations */}
        <section id="foundation" className="mx-auto max-w-6xl px-6 pb-24">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">CareCircle Global Foundation</h2>
            <p className="mt-2 text-slate-600">
              Every subscription helps. From each <strong>Elite plan</strong>, we donate <strong>$1.00</strong>.
              From each <strong>Lite plan</strong>, we donate <strong>$0.50</strong>. 100% of dedicated donations go to the Foundation.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <a
                href={env.donateOnce ? "/api/stripe/checkout?priceId=" + env.donateOnce + "&mode=payment" : "#"}
                aria-disabled={!env.donateOnce}
                className={"inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 " + (!env.donateOnce ? "pointer-events-none opacity-50" : "")}
              >Donate $1.00 (One-time)</a>
              <a
                href={env.donateMonthly ? "/api/stripe/checkout?priceId=" + env.donateMonthly + "&mode=subscription" : "#"}
                aria-disabled={!env.donateMonthly}
                className={"inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 " + (!env.donateMonthly ? "pointer-events-none opacity-50" : "")}
              >Donate $1.50 / month</a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-4 space-y-3">
            <details className="rounded-2xl border border-slate-200 p-4 bg-white shadow-sm">
              <summary className="cursor-pointer font-medium">Is this HIPAA compliant?</summary>
              <p className="mt-2 text-sm text-slate-600">We follow industry best practices for protecting data in transit and at rest. Compliance claims require formal audits.</p>
            </details>
            <details className="rounded-2xl border border-slate-200 p-4 bg-white shadow-sm">
              <summary className="cursor-pointer font-medium">Is this COPPA compliant for minors?</summary>
              <p className="mt-2 text-sm text-slate-600">We design for families with parent/guardian-managed accounts and minimal data collection for minors.</p>
            </details>
            <details className="rounded-2xl border border-slate-200 p-4 bg-white shadow-sm">
              <summary className="cursor-pointer font-medium">Can I cancel anytime?</summary>
              <p className="mt-2 text-sm text-slate-600">Yes — subscriptions are month-to-month.</p>
            </details>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>{new Date().getFullYear()} CareCircle</div>
          <nav className="flex gap-4">
            <a className="underline" href="/privacy">Privacy</a>
            <a className="underline" href="/terms">Terms</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
