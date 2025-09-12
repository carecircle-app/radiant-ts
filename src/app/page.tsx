import Link from "next/link";
import type { ReactNode } from "react";

// NOTE: Server Component (no "use client")
export const metadata = {
  title: "CareCircle  Coordinate care with confidence",
  description:
    "Shared calendars, medication reminders, geofencing alerts, secure chat, and visit notes  all in one app for families and caregivers.",
};

const CTA = ({ href, children }: { href: string; children: ReactNode }) => (
  <a
    href={href}
    className="inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium hover:underline"
  >
    {children}
  </a>
);

export default function Page() {
  // TEST prices for Preview; replace with live when ready
  const priceLite  = "price_1S3jjE07Y1VOtQQTGbpD36z4";
  const priceElite = "price_1S3laJ07Y1VOtQQTbQkTXlK6";

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between border-b">
        <div className="text-xl font-semibold">CareCircle</div>
        <nav className="hidden md:flex gap-6 text-sm">
          <Link className="hover:underline" href="/pricing">Pricing</Link>
          <Link className="hover:underline" href="/company">Company</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-2xl border p-8 md:p-14 shadow-sm"
             style={{
               background: "linear-gradient(135deg, #e9d5ff 0%, #dbeafe 40%, #fee2e2 100%)"
             }}>
          <h1 className="text-4xl md:text-6xl font-extrabold text-center">
            Coordinate care with <span className="text-slate-700">confidence.</span>
          </h1>
          <p className="mt-6 text-center text-slate-700 max-w-3xl mx-auto text-lg">
            Shared calendars, medication reminders, geofencing alerts, and secure messaging — all in one app for families and caregivers.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <CTA href={`/api/stripe/checkout?priceId=${priceLite}`}>Start Lite</CTA>
            <CTA href={`/api/stripe/checkout?priceId=${priceElite}`}>Go Elite</CTA>
          </div>
          <p className="mt-6 text-center text-xs text-slate-600">Test cards only — Powered by Stripe Checkout</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          ["Geofencing Alerts","Real-time notifications when loved ones arrive or leave a place."],
          ["Shared Calendar","Plan visits, tasks, and handoffs with reminders for everyone."],
          ["Medication Reminders","On-time prompts and confirmations to keep doses on track."],
          ["Visit Notes & Docs","Keep visit notes, files, and instructions together and secure."],
          ["Chat & Notifications","Private messaging keeps your whole circle in the loop."],
          ["Permissions & Roles","Granular access for each family member and caregiver."],
        ].map(([title,desc]) => (
          <div key={title as string} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="font-semibold">{title}</div>
            <div className="mt-2 text-sm text-slate-600">{desc}</div>
          </div>
        ))}
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-10 border-t text-sm text-slate-500">
        {new Date().getFullYear()} CareCircle
      </footer>
    </main>
  );
}
