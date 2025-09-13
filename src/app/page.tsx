import type { Metadata } from "next";
import { Gradient } from "@/components/gradient";
import { LinkedAvatars } from "@/components/linked-avatars";
import { LogoCloud } from "@/components/logo-cloud";
import StripeCTAButtons from "@/components/StripeCTAButtons";

export const metadata: Metadata = {
  title: "CareCircle — Coordinate care with confidence",
  description:
    "CareCircle helps families and caregivers coordinate daily care with a shared calendar, medication reminders, geofencing alerts, geofencing, and secure messaging."
};

export default function Home() {
  return (
    <main className="relative">
      {/* Subtle background glow */}
      <Gradient className="pointer-events-none absolute inset-0 -z-10 opacity-40" />

      {/* HERO */}
      <section className="px-6 pt-16 pb-8 sm:px-8 lg:px-10 lg:pt-20">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Coordinate care with confidence
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Shared calendar, caregiver scheduling, medication reminders, geofencing alerts, and secure messaging—built for families and caregivers.
          </p>

          <div className="mt-6 flex justify-center">
            <LinkedAvatars className="opacity-90" />
          </div>

          {/* NEW COLORED TWO-LINE CTA BUTTONS */}
          <div className="mt-10">
            <StripeCTAButtons />
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section className="px-6 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <LogoCloud />
        </div>
      </section>

      {/* FEATURE CARDS (simple native markup so there are no missing imports) */}
      <section className="px-6 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Everything your care circle needs
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Shared calendar"
              desc="All appointments and tasks in one place with reminders."
            />
            <FeatureCard
              title="Caregiver scheduling"
              desc="Assign duties, balance workloads, and avoid conflicts."
            />
            <FeatureCard
              title="Medication reminders"
              desc="Timely prompts for meds, refills, and dosage notes."
            />
            <FeatureCard
              title="Geofencing alerts"
              desc="Get notified when loved ones arrive or leave set locations."
            />
            <FeatureCard
              title="Secure messaging"
              desc="Private updates, photos, and notes for your family."
            />
            <FeatureCard
              title="Activity history"
              desc="A clean trail of what happened and when—no guesswork."
            />
          </div>
        </div>
      </section>

      {/* FOOTER NOTE */}
      <section className="px-6 pb-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center text-sm text-slate-500">
          Portions of every subscription support the CareCircle Global Foundation.
        </div>
      </section>
    </main>
  );
}

/** Small, dependency-free feature card */
function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
    </div>
  );
}
