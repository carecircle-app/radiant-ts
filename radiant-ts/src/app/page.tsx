// src/app/page.tsx
import MiniOpsBar from "@/components/MiniOpsBar";

// --- SEO / Social ---
export const metadata = {
  title: "CareCircle — Coordinate care with confidence",
  description:
    "Shared calendar, medication reminders, geofencing alerts, and secure chat for families and caregivers.",
  openGraph: {
    title: "CareCircle — Coordinate care with confidence",
    description:
      "Shared calendar, medication reminders, geofencing alerts, and secure chat for families and caregivers.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "CareCircle",
    images: [],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareCircle — Coordinate care with confidence",
    description: "Shared calendar, meds, geofence alerts, and secure chat.",
  },
};

export default function Home() {
  // Read env on the server (App Router server component)
  const litePrice = process.env.NEXT_PUBLIC_STRIPE_PRICE_LITE ?? "";
  const elitePrice = process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE ?? "";
  const donateOnce = process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_ONETIME ?? "";
  const donateMonthly = process.env.NEXT_PUBLIC_STRIPE_PRICE_DONATE_MONTHLY ?? "";

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white px-3 py-2 rounded-md shadow"
      >
        Skip to content
      </a>

      {/* Header */}
      <header
        aria-label="Primary"
        className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b"
      >
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="font-semibold tracking-tight">CareCircle</div>
          <nav className="hidden sm:flex gap-6 text-sm text-slate-700">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#who" className="hover:text-slate-900">Who we are</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#foundation" className="hover:text-slate-900">Foundation</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </nav>
          <a
            href="/pricing"
            className="hidden sm:inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            aria-label="See full pricing"
          >
            View pricing
          </a>
        </div>
      </header>

      <main id="main">
        {/* HERO */}
        <section id="hero" className="relative bg-gradient-to-b from-emerald-50 via-sky-50 to-white">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <p className="text-xs uppercase tracking-widest text-emerald-700/80">Welcome</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
              Coordinate care with confidence
            </h1>
            <p className="mt-4 text-slate-600 md:text-lg">
              Shared calendar, medication reminders, geofencing alerts, and secure chat — built for families and caregivers.
            </p>

            {/* Primary CTAs — UPDATED COLORS */}
            <div className="mt-8 flex justify-center gap-3">
              {/* Lite = emerald */}
              <a
                href={litePrice ? `/api/stripe/checkout?priceId=${litePrice}` : "/pricing"}
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-white shadow hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
              >
                Start Lite
              </a>

              {/* Elite = sky */}
              <a
                href={elitePrice ? `/api/stripe/checkout?priceId=${elitePrice}` : "/pricing"}
                className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-white shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2"
              >
                Go Elite
              </a>
            </div>

            <p className="mt-4 text-xs text-slate-500">Test cards only • Powered by Stripe Checkout</p>

            {/* Trust bar */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-500">
              <div className="rounded-2xl border border-slate-200 px-3 py-2 bg-white">Encrypted in transit (TLS)</div>
              <div className="rounded-2xl border border-slate-200 px-3 py-2 bg-white">Privacy-first design</div>
              <div className="rounded-2xl border border-slate-200 px-3 py-2 bg-white">Stripe payments</div>
              <div className="rounded-2xl border border-slate-200 px-3 py-2 bg-white">99.9% uptime target</div>
            </div>
          </div>
        </section>

        {/* Mini Ops / Status */}
        <section className="mt-8 mb-4">
          <MiniOpsBar />
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-6xl px-6 pb-16 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <article className="rounded-2xl border border-slate-200 p-6 bg-white">
              <h2 className="text-lg font-semibold">Shared Care Calendar</h2>
              <p className="mt-2 text-sm text-slate-600">Plan visits and routines with reminders everyone can see.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 p-6 bg-white">
              <h2 className="text-lg font-semibold">Medications &amp; MAR</h2>
              <p className="mt-2 text-sm text-slate-600">Doses, refills, and simple MAR logs with photo proof.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 p-6 bg-white">
              <h2 className="text-lg font-semibold">Geofence &amp; Alerts</h2>
              <p className="mt-2 text-sm text-slate-600">Real-time arrival and leave alerts with panic SOS and follow-ups.</p>
            </article>
          </div>
        </section>

        {/* WHO WE ARE */}
        <section id="who" className="mx-auto max-w-6xl px-6 pb-16">
          <div className="rounded-2xl border border-slate-200 p-6 bg-white">
            <h2 className="text-xl font-semibold">Who we are</h2>
            <p className="mt-2 text-slate-600">
              CareCircle is a tiny team focused on one thing: reducing the stress of coordinating care across families and caregivers.
              We build practical tools, keep data private, and ship improvements quickly.
            </p>
          </div>
        </section>

        {/* PRICING CTA */}
        <section id="pricing" className="mx-auto max-w-6xl px-6 pb-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Pick a plan that fits</h2>
            <p className="mt-2 text-slate-600">Transparent pricing. Cancel anytime.</p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <a
                href="/pricing"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                aria-label="See pricing details"
              >
                See pricing details
              </a>
              {/* Repeat plan CTAs with colors */}
              <a
                href={litePrice ? `/api/stripe/checkout?priceId=${litePrice}` : "/pricing"}
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-white shadow hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
              >
                Start Lite
              </a>
              <a
                href={elitePrice ? `/api/stripe/checkout?priceId=${elitePrice}` : "/pricing"}
                className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-white shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2"
              >
                Go Elite
              </a>
            </div>
          </div>
        </section>

        {/* FOUNDATION IMPACT (with colored donation CTAs) */}
        <section id="foundation" className="mx-auto max-w-6xl px-6 pb-24">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">CareCircle Global Foundation</h2>
            <p className="mt-2 text-slate-600">
              Every subscription helps. From each <strong>Elite plan</strong>, we donate <strong>$1.00</strong>.{" "}
              From each <strong>Lite plan</strong>, we donate <strong>$0.50</strong>. 100% of dedicated donations go to the Foundation.
            </p>

            {/* Donation CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              {/* One-time = emerald */}
              <a
                href={donateOnce ? `/api/stripe/checkout?priceId=${donateOnce}` : "#"}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-60"
                aria-disabled={!donateOnce}
              >
                Donate $1.00 (One-time)
              </a>

              {/* Monthly = amber; requires recurring price */}
              {donateMonthly ? (
                <a
                  href={`/api/stripe/checkout?priceId=${donateMonthly}`}
                  className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-white shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
                >
                  Donate $1.50 / month
                </a>
              ) : (
                <button
                  className="inline-flex cursor-not-allowed items-center justify-center rounded-md bg-amber-300/70 px-4 py-2 text-white/80 shadow"
                  aria-disabled
                  title="Monthly donation not available yet"
                >
                  Donate $1.50 / month
                </button>
              )}
            </div>
          </div>

          {/* Info cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <h3 className="text-lg font-semibold">Our Impact</h3>
              <p className="mt-2 text-sm text-slate-600">
                Together we have funded <strong>250+ meals</strong> and supported <strong>80 children</strong>.
                Real-time stats and updates will appear here.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <h3 className="text-lg font-semibold">Stories &amp; Updates</h3>
              <p className="mt-2 text-sm text-slate-600">
                Photos, short videos, and field updates will be showcased here so you can see how your support helps.
              </p>
              <div className="mt-3 bg-slate-100 aspect-video flex items-center justify-center text-slate-400 rounded-md">
                [ Video / Photo Placeholder ]
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="mt-4 space-y-3">
            <details className="rounded-2xl border border-slate-200 p-4 bg-white">
              <summary className="cursor-pointer font-medium">Is this HIPAA compliant?</summary>
              <p className="mt-2 text-sm text-slate-600">
                We follow industry best practices for protecting data in transit and at rest.
                Compliance claims require formal audits; we will publish details before any official release.
              </p>
            </details>
            <details className="rounded-2xl border border-slate-200 p-4 bg-white">
              <summary className="cursor-pointer font-medium">Can I cancel anytime?</summary>
              <p className="mt-2 text-sm text-slate-600">Yes — subscriptions are month-to-month.</p>
            </details>
          </div>
        </section>
      </main>

      {/* Footer */}
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
