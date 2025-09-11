// NOTE: Do NOT add "use client" here.
import Link from "next/link";

import StripeCTAButtons from "@/components/StripeCTAButtons";
import { Container } from "@/components/container";
import { Testimonials } from "@/components/Testimonials";


// Icons for presentational sections
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
import type { SVGProps, ComponentType } from "react";

// Small helpers for presentational cards (server-safe)
type IconT = ComponentType<SVGProps<SVGSVGElement>>;

function FeatureCard({
  title,
  body,
  Icon,
}: {
  title: string;
  body: string;
  Icon: IconT;
}) {
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
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Simple hero with a top CTA block */}
      <header className="bg-gradient-to-br from-blue-100 via-green-100 to-purple-200">
        <Container>
          <div className="mx-auto max-w-3xl py-20 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900">
              Calm, coordinated care for your family
            </h1>
            <p className="mt-4 text-gray-700">
              Share tasks, updates, and support in one private space.
            </p>
            <div className="mt-8 flex justify-center">
              <StripeCTAButtons />
            </div>
          </div>
        </Container>
      </header>

      {/* Feature icon grid (presentational only) */}
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

      <main className="flex-1">
        {/* Mid-page CTA — anchor so any “Get started” links can scroll here */}
        <section
          id="plans"
          className="py-20 bg-gradient-to-r from-blue-50 via-green-50 to-purple-100"
        >
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Get started in seconds
              </h3>
              <p className="mt-4 text-gray-600">
                Pick a plan that fits your family. You can switch or cancel
                anytime.
              </p>
              <div className="mt-8 flex justify-center">
                <StripeCTAButtons />
              </div>
            </div>
          </Container>
        </section>

        {/* How it works (presentational only) */}
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

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <Container>
            <h2 className="text-2xl sm:text-3xl font-semibold text-center text-gray-900 mb-12">
              Families love the calm CareCircle creates
            </h2>
            <Testimonials />
          </Container>
        </section>
      </main>

      {/* Bottom CTA */}
      <section className="py-16 text-center bg-gradient-to-r from-blue-50 via-green-50 to-purple-100">
        <h2 className="text-2xl font-semibold mb-4">
          Ready to support CareCircle?
        </h2>
        <div className="flex justify-center">
          <StripeCTAButtons />
        </div>
        <p className="mt-3 text-sm text-gray-600">
          Your subscription or donation helps families everywhere coordinate
          care with ease.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-tr from-blue-100 via-green-100 to-purple-200 py-10">
        <Container className="text-center">
          <p className="text-sm text-gray-700 mb-4">
            © {new Date().getFullYear()} CareCircle. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/privacy" className="text-blue-700 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-blue-700 hover:underline">
              Terms of Service
            </Link>
            <Link href="/refunds" className="text-blue-700 hover:underline">
              Refund Policy
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
