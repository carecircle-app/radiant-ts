import StripeCTAButtons from "@/components/StripeCTAButtons";

export const metadata = {
  title: "CareCircle  Coordinate care with confidence",
  description:
    "CareCircle helps families and caregivers coordinate daily care with a shared calendar, medication reminders, geofencing alerts, and secure messaging."
};

export default function Home() {
  return (
    <main className="relative px-6 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          Coordinate care with confidence
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Shared calendar, caregiver scheduling, medication reminders, real-time geofencing alerts, and secure messaging—built for families and caregivers.
        </p>

        {/* CTAs (component already has hard-safe layout) */}
        <div className="mt-10">
          <StripeCTAButtons />
        </div>
      </div>
    </main>
  );
}