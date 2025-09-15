import { R } from "@/lib/routes"; // keep your route helper

export type FeatureItem = { text: string; href?: string };

export const PLAN_FEATURES: { free: FeatureItem[]; lite: FeatureItem[]; elite: FeatureItem[] } = {
  free: [
    { text: "👶 1 kid", href: R.pricing },
    { text: "📅 Family calendar (simple)", href: R.calendar },
    { text: "✅ Chores & reminders (basic)", href: R.tasks },
    { text: "💬 Family chat (short history)", href: R.chat },
    { text: "📍 Geofencing alerts (1–2 places)", href: R.map },
  ],
  lite: [
    { text: "👧👦 2 kids", href: R.tasks },
    { text: "📅 Better calendar (colors + smarter reminders)", href: R.calendar },
    { text: "✅ Chores with photo check", href: R.tasks },
    { text: "📲 Text + app alerts for chores", href: R.tasks },
    { text: "🔒 Lock / pause internet*", href: R.devices },
    { text: "🎥 Quick check-in video", href: R.livestream },
    { text: "🛒 Shopping lists + keep simple receipts", href: R.receipts },
    { text: "🅿️ Park-my-car helper (save the spot)", href: R.map },
    { text: "📍 Home & school alerts (2 places)", href: R.map },
  ],
  elite: [
    { text: "👩‍👩‍👧‍👦 Up to 5 kids (or more)", href: R.tasks },
    { text: "📅 Super calendar (smart colors & nudges)", href: R.calendar },
    { text: "✅ Chores that nudge kindly if they forget", href: R.tasks },
    { text: "📲 Text + push + phone-style alerts", href: R.tasks },
    { text: "📍 Geofencing & arrival/leave alerts", href: R.map },
    { text: "🔒 Lock screen / pause internet / shut down*", href: R.devices },
    { text: "💬 Unlimited chat & longer live video check-ins", href: R.livestream },
    { text: "🛒 Receipts, budgets, shopping lists (advanced)", href: R.receipts },
    { text: "🅿️ Park-my-car + find my spot", href: R.map },
    { text: "📂 Safe place for doctor notes & school forms", href: R.docs },
    { text: "🛡️ Family safety (parents, kids, relatives, caregivers)", href: R.devices },
    { text: "🚨 SOS & fall alerts, loud alarm", href: R.devices },
    { text: "❤️ Priority support (fast help)", href: R.pricing },
    { text: "🧼 ADL checklists + caregiver handoff", href: R.health },
    { text: "❤️ Vital signs (BP, heart, temp, O2, weight)", href: R.health },
    { text: "🍎 Diabetes logs (sugar, insulin, food)", href: R.health },
    { text: "💊 Medicine helper & MAR (pill times, refills, export)", href: R.health },
    { text: "📝 Daily care notes with photos & reports", href: R.health },
  ],
};
