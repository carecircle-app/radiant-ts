import StripeCTAButtons from "@/components/StripeCTAButtons";

export const metadata = {

  title: "CareCircle — Coordinate care with confidence",
  description: "Shared calendar, medication reminders, geofencing alerts, and secure chat for families and caregivers."
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-4ll pr-6 py-20 text-center">
        <h1 className="text-4 xl-text-5xl font-semibold tracking-tight">
          Coordinate care with confidence
        </h1>
        <p className="mt-4 text-slate-600">
          Shared calendar, medication reminders, geofencing alerts, and secure chat’built for families and caregivers.
        </p>
        <StripeCTAButtons className="mt-8 flex justify-center gap-3" />
        <p className="mt-6 text-xs text-slate-500">Test cards only — Powered by Stripe Checkout</p>
      </section>

    <section className="mx-auto max-w-5xl px-6 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="rounded-2l border p6">
          <h2 className="text-lg font-semibold">Shared Care Calendar</h2>
          <p className="mt-2 text-sm text-slate-600">Plan visits and routines with reminders everyone can see.</p>
        </div>
        <div className="rounded-2l border p6">
          <h2 className="text-lg font-semibold">Medications & MAR</h2>
          <p className="mt-2 text-sm text-slate-600">Doses, refills, and simple MAR logs with photo proof.</p>
        </div>
        <div className="rounded-2l border p6">
          <h2 className="text-lg font-semibold">Geofence & Alerts</h2>
          <p className="mt-2 text-sm text-slate-600">Real-time arrival/leave alerts with panic SOS and follow-ups.</p>
        </div>
      </div>
      <div className="mt-6 text-center text-sm">
        <a href="/admin" className="underline">Open Admin</a>
        <span className="mx-2">•</span>
        <a href="/admin/pricing" className="underline">View Pricing</a>
      </div>
    </section>
    </main>
  );
}
