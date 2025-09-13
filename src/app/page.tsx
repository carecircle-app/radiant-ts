import type { Metadata } from "next";
import { Gradient } from "@/components/gradient";
import { LogoCloud } from "@/components/logo-cloud";
import { LinkedAvatars } from "@/components/linked-avatars";
import StripeCTAButtons from "@/components/StripeCTAButtons";

export const metadata: Metadata = {
  title: "CareCircle  Coordinate care with confidence",
  description:
    "CareCircle helps families and caregivers coordinate daily care with a shared calendar, medication reminders, geofencing alerts, and secure messaging."
};

export default function Home() {
  return (
    <main className="relative">
      {/* Background decoration */}
      <Gradient className="pointer-events-none absolute inset-0 -z-10 opacity-40" />

      {/* HERO */}
      <section className="px-6 pt-16 pb-10 sm:px-8 lg:px-10 lg:pt-20">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Coordinate care with confidence
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Shared calendar, caregiver scheduling, medication reminders, real-time geofencing alerts, and secure messagingbuilt for families and caregivers.
          </p>

          <div className="mt-6 flex justify-center">
            <LinkedAvatars className="opacity-90" />
          </div>

          <div className="mt-10">
            {/* CTA buttons (overlap-proof version already in component) */}
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

      {/* Footer note */}
      <section className="px-6 pb-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center text-sm text-slate-500">
          Portions of every subscription support the CareCircle Global Foundation.
        </div>
      </section>
    </main>
  );
}