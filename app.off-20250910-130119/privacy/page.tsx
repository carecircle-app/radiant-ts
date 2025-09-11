'use client'
import { useState } from 'react'

export default function PrivacyPage() {
  const [status, setStatus] = useState<string>('')

  async function handleAction(endpoint: string) {
    try {
      setStatus('Working...')
      const res = await fetch(endpoint, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      setStatus(`✅ Success: ${endpoint}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setStatus(`❌ Failed: ${msg}`)
    }
  }

  return (
    <main className="prose mx-auto max-w-3xl p-6">
      <h1>Privacy, Safety & Legal</h1>
      <p>
        We design CareCircle for families and may process data about children
        (e.g., chores, geofences, device controls) only with a parent/guardian
        account.
      </p>

      <h2>Kids’ Privacy & Parental Consent</h2>
      <p>
        For users under 13 in the U.S., we obtain verifiable parental consent
        and provide a parent dashboard to review/delete the child’s data (COPPA).
      </p>

      <h2>What We Collect</h2>
      <ul>
        <li>Account & circle data: names, roles (Owner/Family/Child/Caregiver/Relative)</li>
        <li>Chores & schedules: titles, due times, ack/photo-proof, repeats</li>
        <li>
          Device signals (optional): IP/port of child device stored locally in
          the browser
        </li>
        <li>
          Location (optional): geofences and last known coordinates (opt-in only)
        </li>
        <li>Uploads: photos (proof, wound care, meds), chat attachments</li>
        <li>
          Vitals/health logs (optional): BP, HR, RR, Temp, SpO₂, glucose,
          weight; caregiver notes and ADL/IADL checklists
        </li>
        <li>
          Telemetry/policy: app events for parental digital wellbeing (if
          configured)
        </li>
      </ul>

      <h2>Your Rights</h2>
      <p>
        You may request access, export, correction, or deletion of your data.
        We provide parent dashboard tools and respond to formal requests.
      </p>

      <div className="my-6 flex gap-4">
        <button
          onClick={() => handleAction('/api/export')}
          className="rounded border px-3 py-1"
        >
          Export My Data
        </button>
        <button
          onClick={() => handleAction('/api/delete')}
          className="rounded border px-3 py-1"
        >
          Delete My Data
        </button>
      </div>

      {status && <p className="text-sm text-gray-600">{status}</p>}

      <h2>Security</h2>
      <p>
        We use HTTPS, role-based access, presigned uploads, and allow parents to
        disable remote device agents at any time.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests? Contact us at{' '}
        <a href="mailto:carecircle@carecircle-app.com">
          carecircle@carecircle-app.com
        </a>
      </p>
    </main>
  )
}
