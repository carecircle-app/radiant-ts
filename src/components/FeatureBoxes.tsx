'use client';
import { useState } from "react";
import { R } from "@/lib/routes";

function ChipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-slate-700 border-slate-300 hover:bg-slate-50"
    >
      {children}
    </a>
  );
}

function Card({
  title,
  children,
  initiallyOpen = false,
  adminLinks = [],
}: {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
  adminLinks?: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <div className="rounded-2xl border border-emerald-200/70 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-emerald-900 font-semibold">{title}</h3>
        <button
          aria-label={open ? "Collapse" : "Expand"}
          onClick={() => setOpen(!open)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          {open ? "–" : "+"}
        </button>
      </div>

      {open && (
        <div className="mt-3 text-slate-700 text-sm space-y-3">
          {children}
          {adminLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {adminLinks.map(link => (
                <ChipLink key={link.href} href={link.href}>Open in Admin → {link.label}</ChipLink>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-emerald-800">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function FeatureBoxes() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1 — Calendar */}
        <Card
          title="📅 Family Calendar (Shared Care)"
          initiallyOpen
          adminLinks={[
            { label: "Calendar", href: R.calendar },
          ]}
        >
          <Section label="What it is"><p>One big family calendar everyone can see.</p></Section>
          <Section label="Why it helps"><p>No more “oops, we forgot!” Everyone knows when and where.</p></Section>
          <Section label="How it works">
            <ul className="list-disc ml-5 space-y-1">
              <li>Make an event ➜ pick people ➜ add repeat (daily/weekly).</li>
              <li>Add reminders (10/30/60 mins).</li>
              <li>People can tap “I saw it!” (acknowledge).</li>
            </ul>
          </Section>
          <Section label="Setup (quick)">
            <ul className="list-disc ml-5 space-y-1">
              <li>Admin ➜ Calendar ➜ “New Event.”</li>
              <li>Choose Child 👦 / Caregiver 👩 / ADL template ✅ from the dropdowns.</li>
              <li>Pick repeat + reminder. Save.</li>
            </ul>
          </Section>
          <Section label="Tiny picture">
            <pre className="text-xs bg-emerald-50 border border-emerald-100 rounded-md p-2 whitespace-pre-wrap">
{`[Mom]----\\
[Dad]----- > 📅 One calendar
[Kids]---/`}
            </pre>
          </Section>
        </Card>

        {/* 2 — Tasks & ADLs */}
        <Card
          title="✅ Smart Tasks & ADLs (Daily Routines)"
          initiallyOpen
          adminLinks={[
            { label: "Tasks", href: R.tasks },
          ]}
        >
          <Section label="What it is">
            <p>Chore lists & care routines (morning, meals, homework, hygiene, sleep).</p>
          </Section>
          <Section label="Why it helps">
            <p>Kids know what to do. Parents see what’s done. Less nagging. 🙂</p>
          </Section>
          <Section label="How it works">
            <ul className="list-disc ml-5 space-y-1">
              <li>Make a task ➜ due time ➜ assign to kid(s).</li>
              <li>For little kids: photo proof + “I did it!” button.</li>
              <li>If they forget ➜ gentle nudges, then SMS.</li>
              <li>(Optional) Parent can pause phone/computer until finished.</li>
            </ul>
          </Section>
          <Section label="Setup (quick)">
            <ul className="list-disc ml-5 space-y-1">
              <li>Admin ➜ Tasks ➜ “New Task.”</li>
              <li>Pick ADL template (Morning/Meals/…) or make your own.</li>
              <li>Toggle Photo proof / SMS alerts / Auto-pause. Save.</li>
            </ul>
          </Section>
          <Section label="Tiny picture">
            <pre className="text-xs bg-emerald-50 border border-emerald-100 rounded-md p-2 whitespace-pre-wrap">
{`🪥 Brush → ✅
🍽️ Dishes → ✅
📚 Homework → (nudge) → ✅`}
            </pre>
          </Section>
        </Card>

        {/* 3 — Meds & MAR */}
        <Card
          title="💊 Meds & MAR (Medication Log)"
          initiallyOpen
          adminLinks={[
            { label: "Meds & MAR", href: R.meds },
            { label: "Health", href: R.health },
            { label: "Diabetes", href: R.healthDiabetes },
            { label: "Reports", href: R.healthReports },
          ]}
        >
          <Section label="What it is"><p>Medicine list + when to take + simple “given” log (MAR).</p></Section>
          <Section label="Why it helps"><p>Fewer misses. Easy hand-offs between parents/caregivers.</p></Section>
          <Section label="How it works">
            <ul className="list-disc ml-5 space-y-1">
              <li>Add med ➜ dose, time(s), who is responsible.</li>
              <li>At time: mark Given / Skipped / Later (add notes/photo).</li>
              <li>Export MAR PDF for doctor/school.</li>
            </ul>
          </Section>
          <Section label="Setup (quick)">
            <ul className="list-disc ml-5 space-y-1">
              <li>Admin ➜ Meds ➜ “Add Medication.”</li>
              <li>Fill name/dose/times + person.</li>
              <li>Use MAR tab to mark each dose.</li>
            </ul>
          </Section>
          <Section label="Tiny picture">
            <pre className="text-xs bg-emerald-50 border border-emerald-100 rounded-md p-2 whitespace-pre-wrap">
{`8:00  💊 Amox 5ml  → ✅ Given by Dad
14:00 💊 Amox 5ml  → ⏳ Later`}
            </pre>
          </Section>
        </Card>

        {/* 4 — Vault */}
        <Card
          title="📂 Visit Notes & Doc Vault"
          adminLinks={[{ label: "Vault", href: R.vault }]}
        >
          <Section label="What it is"><p>A safe folder for doctor notes, school forms, IDs, photos.</p></Section>
          <Section label="Why it helps"><p>Everything in one place when someone asks “do you have…?”</p></Section>
          <Section label="How it works">
            <ul className="list-disc ml-5 space-y-1">
              <li>Upload files (photo/PDF).</li>
              <li>Tag with person + type (IEP, shot record, etc.).</li>
              <li>Search by name/date/tag.</li>
            </ul>
          </Section>
          <Section label="Setup (quick)">
            <ul className="list-disc ml-5 space-y-1">
              <li>Admin ➜ Vault ➜ “Upload.”</li>
              <li>Add title + tags.</li>
              <li>Choose who can see (Family / Relatives / Caregivers / Custom).</li>
            </ul>
          </Section>
          <Section label="Tiny picture">
            <pre className="text-xs bg-emerald-50 border border-emerald-100 rounded-md p-2 whitespace-pre-wrap">
{`[IEP.pdf] [InsuranceCard.jpg] [DoctorNote.pdf]`}
            </pre>
          </Section>
        </Card>

        {/* 5 — Household */}
        <Card
          title="🏡 Household & Mental Load"
          adminLinks={[
            { label: "Household", href: R.receipts },
          ]}
        >
          <Section label="What it is"><p>Chores, shopping lists, budgets, school deadlines.</p></Section>
          <Section label="Why it helps"><p>Less chaos. Clear “Today’s 3” to focus on.</p></Section>
          <Section label="How it works">
            <ul className="list-disc ml-5 space-y-1">
              <li>Make lists (groceries, to-dos).</li>
              <li>Assign items to people; add due dates.</li>
              <li>Snap receipt photos; simple budgets.</li>
            </ul>
          </Section>
          <Section label="Setup (quick)">
            <ul className="list-disc ml-5 space-y-1">
              <li>Admin ➜ Household ➜ “New List.”</li>
              <li>Add items ➜ assign ➜ due.</li>
              <li>(Optional) Turn on receipt capture or budget.</li>
            </ul>
          </Section>
          <Section label="Tiny picture">
            <pre className="text-xs bg-emerald-50 border border-emerald-100 rounded-md p-2 whitespace-pre-wrap">
{`🛒 Milk (Ryan)  → ✅
🧽 Mop floor (Derek) → ⏳`}
            </pre>
          </Section>
        </Card>

        {/* 6 — Chat */}
        <Card
          title="💬 Family Chat & Check-ins"
          adminLinks={[
            { label: "Chat", href: R.chat },
            { label: "Live check-in", href: R.livestream },
          ]}
        >
          <Section label="What it is"><p>Private chat only for your circle, with optional short live video.</p></Section>
          <Section label="Why it helps"><p>Fast updates (“We’re leaving now!”), share photos/files, no outsiders.</p></Section>
          <Section label="How it works">
            <ul className="list-disc ml-5 space-y-1">
              <li>1:1 or group chat.</li>
              <li>Drop photos/notes.</li>
              <li>Optional short livestream for quick check-ins.</li>
            </ul>
          </Section>
        </Card>

        {/* 7 — Security / Controls */}
        <Card
          title="🛡️ Security, Sharing & Parental Controls"
          adminLinks={[
            { label: "Members", href: R.admin + "?tab=members" },
            { label: "Devices", href: R.devices },
            { label: "Parental Enforce", href: R.enforce },
          ]}
        >
          <Section label="What it is"><p>Who sees what + gentle device controls (parents only).</p></Section>
          <Section label="Why it helps"><p>Safety + privacy + calm ways to guide kids.</p></Section>
          <Section label="How it works">
            <ul className="list-disc ml-5 space-y-1">
              <li>Roles: Owner/Parent, Minor, Relative (limited), Caregiver (expires).</li>
              <li>Each item has audience: Family / Relatives / Caregivers / Custom.</li>
              <li>Parental Enforce: lock screen, pause internet, loud alert.</li>
            </ul>
          </Section>
          <Section label="Setup (quick)">
            <ul className="list-disc ml-5 space-y-1">
              <li>Admin ➜ Members ➜ add people + role.</li>
              <li>On any event/task/file ➜ choose audience.</li>
              <li>For device controls: Devices ➜ add IP + Port + Secret (see Box 8).</li>
            </ul>
          </Section>
        </Card>

        {/* 8 — Geofencing */}
        <Card
          title="📍 Geofencing, Devices & Alerts (Optional)"
          adminLinks={[
            { label: "Geofences", href: R.map },
            { label: "Devices", href: R.devices },
            { label: "Parental Enforce", href: R.enforce },
          ]}
        >
          <Section label="What it is">
            <p>“Places” that send alerts when someone arrives or leaves, plus optional device agent for gentle controls.</p>
          </Section>
          <Section label="Why it helps">
            <p>Peace of mind: “They got to school/home.” SOS when needed.</p>
          </Section>
          <Section label="How it works">
            <ul className="list-disc ml-5 space-y-1">
              <li>Add zones: Home 🏠 / School 🏫 / Park ⚽ / Store 🛒.</li>
              <li>Phone enters/exits ➜ push/SMS to guardians. Optional “Are you safe?” follow-up.</li>
              <li><em>Example:</em> Kid leaves <strong>Home</strong> → alert. Arrives at <strong>School</strong> → alert. Leaves <strong>School</strong> early → alert.</li>
              <li>Device agent can receive pause/lock/alert requests.</li>
            </ul>
          </Section>
          <Section label="Setup (quick)">
            <ul className="list-disc ml-5 space-y-1">
              <li>Admin ➜ Geofences ➜ add name + map pin + circle size.</li>
              <li>Turn on SMS (parent phone in profile).</li>
              <li>Devices (optional): add device name + IP + Port (e.g., 8088) + Secret, then test Ping.</li>
              <li>To enforce: Admin ➜ Parental Enforce ➜ choose action.</li>
            </ul>
          </Section>
          <Section label="Tiny picture">
            <pre className="text-xs bg-emerald-50 border border-emerald-100 rounded-md p-2 whitespace-pre-wrap">
{`   🏫
   |  "Arrived!"
🏠-+
   |  "Left!"
  ⚽`}
            </pre>
          </Section>
        </Card>
      </div>
    </section>
  );
}
