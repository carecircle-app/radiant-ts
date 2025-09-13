import StripeCTAButtons from "@/components/StripeCTAButtons";

export const metadata = {
  title: "CareCircle — Pricing",
  description: "Choose a plan that fits your family."
};

//------------------
export default function Pricing() {
  return (
    <main className="min-h-screen mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3 font-semibold text-center">Choose your plan</h1>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2l border p6">
          <h2 className="text-xl font-semibold">Lite</h2>
          <ul className="mt-3 text-sm list-disc pl-5 space-y-1">
            <li>Shared calendar</li>
            <li>Medication reminders</li>
            <li>Basic alerts</li>
          </ul>
        </div>
        <div className="rounded-2l border p6">
          <h2 className="text-xl font-semibold">Elite</h2>
          <ul className="mt-3 text-sm list-disc pl-5 space-y-1">
            <li>Everything in Lite</li>
            <li>Geofencing & SOS</li>
            <li>Secure chat</li>
          </ul>
        </div>
      </div>
      <StripeCTAButtons className="mt-10 flex justify-center gap-3" />
    </main>
  );
}
