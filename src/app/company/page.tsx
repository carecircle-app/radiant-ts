
import Link from "next/link";
import Container from "@/components/container";   // <-- add this line
import StripeCTAButtons from "@/components/StripeCTAButtons";
import Testimonials from "@/components/Testimonials";

/** Page metadata (shown in the tab and for SEO) */
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

function LogoCareCircle({ className = "h-10 w-10" }: { className?: string }) {
  const teal = "#0F9B93";
  const sky = "#38BDF8";
  return (
    <svg className={className} viewBox="0 0 120 120" role="img" aria-label="CareCircle">
      <circle cx="60" cy="60" r="54" fill="none" stroke={sky} strokeWidth="12" />
      <g transform="translate(12,12) scale(0.82)">
        <path
          d="M60 95 L32 67 C20 55 20 36 32 24 c12-12 31-12 43 0"
          fill="none" stroke={teal} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M60 95 L88 67 c12-12 12-31 0-43 c-12-12-31-12-43 0"
          fill="none" stroke={sky} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default function Home() {
  return (
    <>
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="CareCircle Home">
            <LogoCareCircle />
            <div className="leading-none text-slate-900">
              <div className="font-bold tracking-tight">CareCircle</div>
              <div className="-mt-0.5 text-xs font-semibold tracking-tight text-slate-600">App</div>
            </div>
          </Link>

          <nav className="hidden gap-6 text-sm text-slate-700 sm:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#who" className="hover:text-slate-900">Who we are</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </nav>

          <a
            href="#pricing"
            className="hidden items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 sm:inline-flex"
          >
            View pricing
          </a>
        </div>
      </header>

      <main>
        {/* ===== Hero ===== */}
        <section className="relative bg-gradient-to-b from-emerald-50 via-sky-50 to-white">
          <Container className="mx-auto max-w-6xl px-6 py-16 text-center">
            <p className="text-xs uppercase tracking-widest text-emerald-700/80">Welcome</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Coordinate care with confidence
            </h1>
            <p className="mt-4 text-slate-600 md:text-lg">
              Shared calendar, medication reminders, geofencing alerts, and secure chat — built for families and caregivers.
            </p>

            {/* Primary CTAs (client component handles Stripe) */}
            <div className="mt-6 flex justify-center">
              <StripeCTAButtons />
            </div>

            {/* Trust bar */}
            <div className="mt-10 grid grid-cols-2 gap-3 text-xs text-slate-500 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">Privacy-first design</div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">Stripe payments</div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">99.9% uptime target</div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">Encrypted in transit (TLS)</div>
            </div>
          </Container>
        </section>

        {/* ===== Features (simple, no extra imports) ===== */}
        <section id="features">
          <Container className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="font-medium">Family Calendar</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Shared schedules and routines with reminders everyone can see.
                </p>
              </div>
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="font-medium">Meds &amp; MAR</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Doses, refills, and simple MAR logs with photo proof.
                </p>
              </div>
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="font-medium">Geofence Alerts</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Arrival/leave alerts with optional SOS follow-up.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4 text-sm">
              <Link href="/admin" className="underline">Open Admin</Link>
              <a href="#pricing" className="underline">View Pricing</a>
            </div>
          </Container>
        </section>

        {/* ===== Who we are ===== */}
        <section id="who">
          <Container className="mx-auto max-w-6xl px-6 pb-12">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Who we are</h2>
              <p className="mt-2 text-slate-600">
                CareCircle is a tiny team focused on reducing the stress of coordinating care across families and caregivers.
              </p>
            </div>
          </Container>
        </section>

        {/* ===== Pricing (light block; CTAs still handled by StripeCTAButtons) ===== */}
        <section id="pricing">
          <Container className="mx-auto max-w-6xl px-6 pb-16 text-center">
            <h2 className="text-2xl font-semibold">Pick a plan that fits</h2>
            <p className="mt-2 text-slate-600">Transparent pricing. Cancel anytime.</p>

            <div className="mx-auto mt-6 grid max-w-4xl gap-6 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-6 text-left shadow-sm">
                <h3 className="text-lg font-semibold">Free</h3>
                <p className="mt-1 text-sm text-slate-600">$0.00 / month</p>
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  <li>1 child</li>
                  <li>Simple family calendar</li>
                  <li>Basic reminders</li>
                </ul>
              </div>

              <div className="rounded-2xl border bg-white p-6 text-left shadow-sm">
                <h3 className="text-lg font-semibold">Lite</h3>
                <p className="mt-1 text-sm text-slate-600">$4.99 / month</p>
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  <li>2 kids</li>
                  <li>Smarter calendar</li>
                  <li>Chores with photo check</li>
                </ul>
              </div>

              <div className="rounded-2xl border bg-white p-6 text-left shadow-sm">
                <h3 className="text-lg font-semibold">Elite</h3>
                <p className="mt-1 text-sm text-slate-600">$9.99 / month</p>
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  <li>Up to 5 kids</li>
                  <li>Pro features and safety alerts</li>
                  <li>Priority support</li>
                </ul>
              </div>
            </div>

            {/* Re-use the same CTA block for pricing */}
            <div className="mt-6 flex justify-center">
              <StripeCTAButtons />
            </div>
          </Container>
        </section>

        {/* ===== Testimonials ===== */}
        <section>
          <Container className="mx-auto max-w-6xl px-6 pb-16">
            <h2 className="mb-4 text-xl font-semibold">What families say</h2>
            <Testimonials />
          </Container>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq">
          <Container className="mx-auto max-w-6xl px-6 pb-20">
            <h2 className="text-xl font-semibold">FAQ</h2>
            <div className="mt-4 space-y-3">
              <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <summary className="cursor-pointer font-medium">Is this HIPAA compliant?</summary>
                <p className="mt-2 text-sm text-slate-600">
                  We follow industry best practices for protecting data in transit and at rest. Compliance claims require formal audits.
                </p>
              </details>
              <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <summary className="cursor-pointer font-medium">Is this COPPA compliant for minors?</summary>
                <p className="mt-2 text-sm text-slate-600">
                  We design for families with parent/guardian-managed accounts and minimal data collection for minors.
                </p>
              </details>
              <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <summary className="cursor-pointer font-medium">Can I cancel anytime?</summary>
                <p className="mt-2 text-sm text-slate-600">Yes — subscriptions are month-to-month.</p>
              </details>
            </div>
          </Container>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>{new Date().getFullYear()} CareCircle</div>
          <nav className="flex gap-4">
            <Link className="underline" href="/privacy">Privacy</Link>
            <Link className="underline" href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}


