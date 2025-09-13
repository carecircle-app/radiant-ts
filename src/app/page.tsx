/**
 * CareCircle Landing  Server Component (no "use client")
 * Shows real content at "/"
 */
import StripeCTAButtons from "@/components/StripeCTAButtons";

export const metadata = {
  title: "CareCircle  Coordinate care with confidence",
  description: "Care coordination for families and caregivers  shared calendar, tasks, medication reminders, geofencing alerts, and secure chat."
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Coordinate care with confidence
        </h1>
        <p className="mt-4 text-slate-600">
          Shared calendar, medication reminders, geofencing alerts, and secure chatbuilt for families and caregivers.
        </p>

        <StripeCTAButtons className="mt-8 flex justify-center gap-3" />

        <p className="mt-6 text-center text-xs text-slate-500">
          Test cards only  Powered by Stripe Checkout
        </p>
        <div className="mt-10 flex justify-center gap-4 text-sm">
          <a href="/admin" className="underline">Open Admin</a>
          <a href="/admin/pricing" className="underline">View Pricing</a>
        </div>
      </section>
    </main>
  );
}