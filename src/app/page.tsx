import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "CareCircle  Coordinate care with confidence",
  description:
    "Shared calendars, medication reminders, geofencing alerts, geofencing alerts, secure chat, and visit notes  all in one app for families and caregivers.",
};

const CTA = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium hover:underline"
  >
    {children}
  </a>
);

export default function Page() {
  // Stripe price ids (replace with your live IDs when ready)
  const priceLite  = "price_153jjje07Y1V0tQQTGbQ36Z4";
  const priceElite = "price_1531a07Y1V0tQQTbkQTXIKG";

  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto max-w-7xl px-6 py-12 flex items-center justify-between border-b">
        <div className="text-xl font-semibold">CareCircle</div>
        <nav className="hidden md:flex gap-6 text-sm">
          <Link className="hover:underline" href="/pricing">Pricing</Link>
          <Link className="hover:underline" href="/company">Company</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Coordinate care with <span className="text-slate-500">confidence.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600">
          Shared calendars, medication reminders, geofencing alerts, and secure messaging  all in one.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <CTA href={`/api/stripe/checkout?priceId=${priceLite}`}>Start Lite</CTA>
          <CTA href={`/api/stripe/checkout?priceId=${priceElite}`}>Go Elite</CTA>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Test cards only  Powered by Stripe Checkout
        </p>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-12 border-t text-sm text-slate-500">
         {new Date().getFullYear()} CareCircle
      </footer>
    </main>
  );
}
