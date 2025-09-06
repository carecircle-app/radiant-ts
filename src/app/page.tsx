// src/app/page.tsx — long landing with science-backed color psychology
import StripeCTAButtons from "@/components/StripeCTAButtons";
import {
  MapPinIcon,
  CalendarDaysIcon,
  BellAlertIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

export const metadata = {
  title: "CareCircle — Coordinate care with confidence",
  description:
    "Shared calendars, medication reminders, geofencing alerts, secure chat, and visit notes — all in one app for families and caregivers.",
};

type IconT = (props: React.SVGProps<SVGSVGElement>) => JSX.Element;

/* ---------- Presentational cards ---------- */
function FeatureCard({ title, body, Icon }: { title: string; body: string; Icon: IconT }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center rounded-xl border bg-white p-2">
          <Icon className="h-6 w-6 text-indigo-700" />
        </span>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{body}</p>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  body,
  Icon,
}: {
  step: number;
  title: string;
  body: string;
  Icon: IconT;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white font-semibold text-indigo-700">
          {step}
        </span>
        <Icon className="h-6 w-6 text-indigo-700" />
        <h4 className="ml-1 text-base font-semibold">{title}</h4>
      </div>
      <p className="mt-3 text-sm text-gray-600">{body}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      {/* === TOP MINI-CTA BAR (indigo = trustworthy primary) === */}
      <section aria-label="Quick sign-up" className="bg-white/80">
        <div className="mx-auto max-w-5xl px-6 pt-6">
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-center gap-3 py-3">
              <a
                href="#plans"
                className="inline-flex items-center rounded-full bg-indigo-600 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Get started
              </a>
              <a
                href="#plans"
                className="inline-flex items-center rounded-full border border-indigo-200 text-indigo-700 px-5 py-2 text-sm font-medium hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Demo video
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6">
          <hr className="my-4 border-gray-200/70" />
        </div>
      </section>

      {/* === HERO with clinically calming gradient (blue → lavender → rose) === */}
      <section className="mx-auto max-w-5xl px-6">
        <div className="rounded-3xl border overflow-hidden shadow-sm">
          <div className="bg-[linear-gradient(135deg,_#D6E9FF_0%,_#E9D7FF_52%,_#FFE3EC_100%)]">
            <div className="px-8 sm:px-14 py-16 sm:py-20 text-center">
              <h1 className="text-[38px] leading-tight sm:text-6xl font-extrabold tracking-tight text-slate-900">
                Coordinate care with
                <br className="hidden sm:block" /> confidence.
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-700 max-w-2xl mx-auto">
                Shared calendars, medication reminders, geofencing alerts, and secure
                messaging — all in one app for families and caregivers.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <a
                  href="#plans"
                  className="inline-flex items-center rounded-full bg-indigo-600 text-white px-5 py-2 text-sm font-semibold hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Get started
                </a>
                <a
                  href="#plans"
                  className="inline-flex items-center rounded-full border border-indigo-200 text-indigo-700 px-5 py-2 text-sm font-medium hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Demo video
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURE ICON GRID (map pin, calendar, chat, etc.) === */}
      <section className="mx-auto max-w-5xl px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            title="Geofencing Alerts"
            body="Real-time notifications when loved ones arrive or leave a place."
            Icon={MapPinIcon}
          />
          <FeatureCard
            title="Shared Calendar"
            body="Plan visits, tasks, and handoffs with reminders for everyone."
            Icon={CalendarDaysIcon}
          />
          <FeatureCard
            title="Medication Reminders"
            body="On-time prompts and confirmations to keep doses on track."
            Icon={BellAlertIcon}
          />
          <FeatureCard
            title="Visit Notes & Docs"
            body="Keep visit notes, files, and instructions together and secure."
            Icon={DocumentTextIcon}
          />
          <FeatureCard
            title="Chat & Notifications"
            body="Private messaging keeps your whole circle in the loop."
            Icon={ChatBubbleOvalLeftEllipsisIcon}
          />
          <FeatureCard
            title="Permissions & Roles"
            body="Granular access for each family member and caregiver."
            Icon={ShieldCheckIcon}
          />
        </div>
      </section>

      {/* === CHOOSE PLAN (your existing Stripe buttons) === */}
      <section id="plans" className="mx-auto max-w-5xl px-6 pb-16">
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Choose Your Plan</h2>
        </div>
        <div className="mx-auto max-w-md">
          <StripeCTAButtons />
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Test cards only — Powered by Stripe Checkout
        </p>
      </section>

      {/* === HOW IT WORKS (keeps scroll depth and trust cues) === */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="text-center text-xl font-semibold text-slate-900 mb-6">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StepCard
            step={1}
            title="Invite your circle"
            body="Create an account, invite family and caregivers, and set roles."
            Icon={ComputerDesktopIcon}
          />
          <StepCard
            step={2}
            title="Sync the plan"
            body="Add appointments, meds, and zones to get real-time alerts."
            Icon={CpuChipIcon}
          />
          <StepCard
            step={3}
            title="Share safely"
            body="Best-practice security and role-based access keep data private."
            Icon={LockClosedIcon}
          />
        </div>
      </section>

      {/* === BOTTOM CTA (repeat) === */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="mx-auto max-w-md">
          <StripeCTAButtons />
        </div>
      </section>
    </main>
  );
}
