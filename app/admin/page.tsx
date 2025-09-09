'use client'
import { useEffect, useMemo, useState } from 'react'

/**
 * Admin Panel – multi-kid, plan-gated chores & parental controls
 * - Local "Kids" (name/IP/port/phones, up to 5) saved in browser (no backend schema changes)
 * - Plan: Free(1), Lite(2), Elite(∞) – enforced at assignment time
 * - Task templates + custom title, Save/Cancel, one-time/daily/weekly scheduling
 * - Ack & Photo-proof toggles
 * - Reminder intervals (per task) + global defaults for Tasks/ADL/Events
 * - Per-kid manual controls (parental enforce actions incl. device shutdown)
 */

const API = 'http://127.0.0.1:4000'

// ---------- tiny helpers ----------
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
function cls(...a: Array<string | false | undefined>) {
  return a.filter(Boolean).join(' ')
}
function parseTimeHHMM(s: string) {
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return { h: 8, m: 0 }
  return {
    h: Math.min(23, Math.max(0, parseInt(m[1], 10))),
    m: Math.min(59, Math.max(0, parseInt(m[2], 10))),
  }
}
function nextAtDaily(hour: number, minute: number) {
  const now = new Date()
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1)
  return d.getTime()
}
function nextAtWeekly(dow: number, hour: number, minute: number) {
  // 0=Sun..6=Sat
  const now = new Date()
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  const delta = (dow - d.getDay() + 7) % 7
  if (delta === 0 && d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7)
  else d.setDate(d.getDate() + delta)
  return d.getTime()
}

// ---------- types (relaxed) ----------
type Role = 'Owner' | 'Family' | 'Child' | 'Minor' | 'Caregiver' | 'Relative'
type User = { id: string; name: string; role: Role }
type Task = {
  id: string
  title: string
  circleId: string
  assignedTo?: string
  due?: number
  completed?: boolean
  proofKey?: string
  forMinor?: boolean
  ackRequired?: boolean
  photoProof?: boolean
  ackAt?: number
  ackBy?: string
  __minorStage?: 0 | 1 | 2 | 3 | 4
  repeat?: 'none' | 'daily' | 'weekly'
  // optional auto-enforce hints (stored server-side if supported)
  autoEnforce?: boolean
  autoAction?:
    | 'screen_lock'
    | 'network_pause'
    | 'device_restart'
    | 'device_shutdown'
    | 'app_restart'
}

type PlanKey = 'free' | 'lite' | 'elite'
const planLimits: Record<PlanKey, number> = { free: 1, lite: 2, elite: 999 }

// Local kid record (stored in browser)
type LocalKid = {
  id: string // local UUID
  name: string
  apiUserId?: string // maps to an API "Child" user id
  ip?: string
  port?: number
  phones?: string[] // up to 5 numbers
  notes?: string
  autoEnforce?: boolean
  autoAction?:
    | 'screen_lock'
    | 'network_pause'
    | 'device_restart'
    | 'device_shutdown'
    | 'app_restart'
}

const LSK_KIDS = 'admin.localKids.v2'
const LSK_OWNER = 'admin.ownerLabel.v1'
const LSK_PLAN = 'admin.plan.v1'

// Common chore templates
const TEMPLATES = [
  'Clean room',
  'Wash dishes',
  'Take out trash',
  'Homework',
  'Laundry',
  'Feed pets',
  'Read 20 minutes',
  'Practice instrument',
]

// Allowed device actions
const ACTIONS = [
  { v: 'play_loud_alert', label: 'Loud alert' },
  { v: 'screen_lock', label: 'Lock screen' },
  { v: 'network_pause', label: 'Pause network' },
  { v: 'device_restart', label: 'Restart device' },
  { v: 'device_shutdown', label: 'Shutdown device' },
  { v: 'app_restart', label: 'Restart app' },
] as const
type ActionV = (typeof ACTIONS)[number]['v']

export default function AdminPage() {
  // Acting user (auth header)
  const [acting, setActing] = useState<string>('u-owner')
  const hdr = useMemo(() => ({ 'x-user-id': acting }), [acting])

  // API data
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const childUsers = users.filter(
    (u) => u.role === 'Child' || u.role === 'Minor',
  )

  // Owner/household label
  const [ownerLabel, setOwnerLabel] = useState<string>('')

  // Plan gating
  const [plan, setPlan] = useState<PlanKey>('elite')
  const maxKids = planLimits[plan]

  // Local kids
  const [kids, setKids] = useState<LocalKid[]>([])
  useEffect(() => {
    try {
      const rawKids = localStorage.getItem(LSK_KIDS)
      if (rawKids) setKids(JSON.parse(rawKids))
      const rawOwner = localStorage.getItem(LSK_OWNER)
      if (rawOwner) setOwnerLabel(rawOwner)
      const rawPlan = localStorage.getItem(LSK_PLAN) as PlanKey | null
      if (rawPlan) setPlan(rawPlan)
    } catch {}
  }, [])
  function persistKids(next: LocalKid[]) {
    setKids(next)
    try {
      localStorage.setItem(LSK_KIDS, JSON.stringify(next))
    } catch {}
  }
  function persistOwner(label: string) {
    setOwnerLabel(label)
    try {
      localStorage.setItem(LSK_OWNER, label)
    } catch {}
  }
  function persistPlan(p: PlanKey) {
    setPlan(p)
    try {
      localStorage.setItem(LSK_PLAN, p)
    } catch {}
  }

  // Task creation state
  const [template, setTemplate] = useState<string>('')
  const [title, setTitle] = useState<string>('Clean room')
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly'>(
    'none',
  )
  const [dueMins, setDueMins] = useState<number>(15)
  const [weeklyDOW, setWeeklyDOW] = useState<number>(1)
  const [timeHHMM, setTimeHHMM] = useState<string>('08:00')
  const [ackRequired, setAckRequired] = useState<boolean>(true)
  const [photoProof, setPhotoProof] = useState<boolean>(true)
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([])
  const [autoAction, setAutoAction] = useState<ActionV>('screen_lock')
  const [autoEnforce, setAutoEnforce] = useState<boolean>(true)
  const [busy, setBusy] = useState(false)

  function resetForm() {
    setTemplate('')
    setTitle('Clean room')
    setRecurrence('none')
    setDueMins(15)
    setWeeklyDOW(1)
    setTimeHHMM('08:00')
    setAckRequired(true)
    setPhotoProof(true)
    setSelectedKidIds([])
    setAutoAction('screen_lock')
    setAutoEnforce(true)
  }

  function toggleKid(id: string) {
    setSelectedKidIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= maxKids) {
        alert(
          `Your plan (${plan}) allows up to ${maxKids === 999 ? 'unlimited' : maxKids} child${maxKids > 1 ? 'ren' : ''}.`,
        )
        return prev
      }
      return [...prev, id]
    })
  }

  // Load API data
  async function loadAll() {
    try {
      const [u, t] = await Promise.all([
        fetch(`${API}/api/users`, { headers: hdr }).then(j<User[]>),
        fetch(`${API}/api/tasks`, { headers: hdr }).then(j<Task[]>),
      ])
      setUsers(u)
      setTasks(t)
    } catch (e) {
      alert('Load failed: ' + (e as Error).message)
    }
  }
  useEffect(() => {
    loadAll()
  }, [acting])

  // Create tasks
  async function createMinorTasks() {
    if (!title.trim()) return alert('Title is required.')
    if (selectedKidIds.length === 0) return alert('Select at least one child.')
    if (childUsers.length === 0)
      return alert(
        "No API 'Child' users found. Add at least one child user to the circle first.",
      )

    setBusy(true)
    try {
      const defaultChildId = childUsers[0]?.id
      const { h, m } = parseTimeHHMM(timeHHMM)
      const posts: Promise<any>[] = []

      for (const localId of selectedKidIds) {
        const kid = kids.find((k) => k.id === localId)
        const apiUserId = kid?.apiUserId || defaultChildId
        if (!apiUserId) continue

        let due: number
        if (recurrence === 'none')
          due = Date.now() + Math.max(1, dueMins) * 60_000
        else if (recurrence === 'daily') due = nextAtDaily(h, m)
        else due = nextAtWeekly(weeklyDOW, h, m)

        posts.push(
          fetch(`${API}/api/tasks`, {
            method: 'POST',
            headers: { ...hdr, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              due,
              assignedTo: apiUserId,
              forMinor: true,
              ackRequired,
              photoProof,
              repeat: recurrence,
              // hint to backend for auto-enforcement (if supported)
              autoEnforce,
              autoAction,
            }),
          }).then(j),
        )
      }
      await Promise.all(posts)
      alert(`Created ${selectedKidIds.length} task(s) ✅`)
      await loadAll()
      resetForm()
    } catch (e) {
      alert('Create failed: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  // Task ACK
  async function ackTask(id: string) {
    try {
      await fetch(`${API}/api/tasks/${id}/ack`, {
        method: 'POST',
        headers: hdr,
      }).then(j)
      await loadAll()
    } catch (e) {
      alert('ACK failed: ' + (e as Error).message)
    }
  }

  // Parental enforce
  async function enforce(apiUserId: string, action: ActionV, reason: string) {
    try {
      await fetch(`${API}/api/parental/enforce`, {
        method: 'POST',
        headers: { ...hdr, 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: apiUserId, action, reason }),
      }).then(j)
      alert(`Enforce sent: ${action} ✅`)
    } catch (e) {
      alert('Enforce failed: ' + (e as Error).message)
    }
  }

  // Owner label change (stored locally)
  function onOwnerLabelChange(v: string) {
    persistOwner(v)
  }

  // Template picker
  function onPickTemplate(v: string) {
    setTemplate(v)
    if (v) setTitle(v)
  }

  // Add / remove / update local kid (max 5)
  function addKid() {
    if (kids.length >= 5) return alert('You can keep up to 5 local kids.')
    const id = 'k-' + Math.random().toString(36).slice(2, 8)
    const next: LocalKid[] = [...kids, { id, name: 'New child', phones: [] }]
    persistKids(next)
  }
  function removeKid(id: string) {
    const next = kids.filter((k) => k.id !== id)
    persistKids(next)
    setSelectedKidIds((prev) => prev.filter((x) => x !== id))
  }
  function updateKid(id: string, patch: Partial<LocalKid>) {
    persistKids(kids.map((k) => (k.id === id ? { ...k, ...patch } : k)))
  }
  function updateKidPhone(id: string, idx: number, value: string) {
    const kid = kids.find((k) => k.id === id)
    const phones = (kid?.phones || []).slice()
    phones[idx] = value
    updateKid(id, { phones })
  }
  function addKidPhone(id: string) {
    const kid = kids.find((k) => k.id === id)
    const phones = (kid?.phones || []).slice()
    if (phones.length >= 5) return
    phones.push('')
    updateKid(id, { phones })
  }
  function removeKidPhone(id: string, idx: number) {
    const kid = kids.find((k) => k.id === id)
    const phones = (kid?.phones || []).slice()
    phones.splice(idx, 1)
    updateKid(id, { phones })
  }

  return (
    <div className="min-h-dvh space-y-8 p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Household / Owner</span>
            <input
              className="rounded border px-2 py-1"
              placeholder="e.g. Mom & Dad"
              value={ownerLabel}
              onChange={(e) => onOwnerLabelChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Acting user</span>
          <select
            className="rounded border px-2 py-1"
            value={acting}
            onChange={(e) => setActing(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
            {users.length === 0 && (
              <>
                <option value="u-owner">Owner (Owner)</option>
                <option value="u-child">Derek (Child)</option>
                <option value="u-fam">Ryan (Family)</option>
              </>
            )}
          </select>
          <button className="ml-2 rounded border px-3 py-1" onClick={loadAll}>
            Refresh
          </button>
        </div>
      </header>

      {/* Plan gating */}
      <section className="grid gap-2 rounded border p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Plan</span>
          <select
            className="rounded border px-2 py-1"
            value={plan}
            onChange={(e) => persistPlan(e.target.value as PlanKey)}
          >
            <option value="free">Free (1 child)</option>
            <option value="lite">Lite (2 children)</option>
            <option value="elite">Elite (unlimited)</option>
          </select>
          <span className="text-xs text-gray-500">
            Max assignees per task: {maxKids === 999 ? 'unlimited' : maxKids}
          </span>
        </div>
      </section>

      {/* Local Kids */}
      <section className="grid gap-3 rounded border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Kids (local, max 5)</h2>
          <button
            className="rounded border px-3 py-1"
            onClick={addKid}
            disabled={kids.length >= 5}
          >
            Add child
          </button>
        </div>
        <div className="grid gap-3">
          {kids.length === 0 && (
            <div className="text-sm text-gray-500">
              No kids yet. Click “Add child”.
            </div>
          )}
          {kids.map((k) => (
            <div key={k.id} className="grid gap-3 rounded border p-3">
              <div className="grid items-end gap-2 md:grid-cols-6">
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">Name</span>
                  <input
                    className="rounded border px-2 py-1"
                    value={k.name || ''}
                    onChange={(e) => updateKid(k.id, { name: e.target.value })}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">
                    Map to API Child
                  </span>
                  <select
                    className="rounded border px-2 py-1"
                    value={k.apiUserId || ''}
                    onChange={(e) =>
                      updateKid(k.id, {
                        apiUserId: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">(auto choose first Child)</option>
                    {childUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.id})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">Device IP</span>
                  <input
                    className="rounded border px-2 py-1"
                    placeholder="192.168.1.42"
                    value={k.ip || ''}
                    onChange={(e) => updateKid(k.id, { ip: e.target.value })}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">Port</span>
                  <input
                    type="number"
                    className="rounded border px-2 py-1"
                    placeholder="8088"
                    value={k.port ?? ''}
                    onChange={(e) =>
                      updateKid(k.id, {
                        port: e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      })
                    }
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">Auto/Manual</span>
                  <select
                    className="rounded border px-2 py-1"
                    value={k.autoEnforce ? 'auto' : 'manual'}
                    onChange={(e) =>
                      updateKid(k.id, {
                        autoEnforce: e.target.value === 'auto',
                      })
                    }
                  >
                    <option value="auto">Automatic</option>
                    <option value="manual">Manual only</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-sm text-gray-600">Auto Action</span>
                  <select
                    className="rounded border px-2 py-1"
                    value={k.autoAction || 'screen_lock'}
                    onChange={(e) =>
                      updateKid(k.id, {
                        autoAction: e.target.value as LocalKid['autoAction'],
                      })
                    }
                  >
                    {ACTIONS.map((a) => (
                      <option key={a.v} value={a.v}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* phones */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Phone numbers (up to 5)
                  </div>
                  <button
                    className="rounded border px-2 py-1 text-sm"
                    onClick={() => addKidPhone(k.id)}
                    disabled={(k.phones || []).length >= 5}
                  >
                    Add phone
                  </button>
                </div>
                {(k.phones || []).map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="rounded border px-2 py-1"
                      placeholder="+1 555…"
                      value={p}
                      onChange={(e) => updateKidPhone(k.id, i, e.target.value)}
                    />
                    <button
                      className="rounded border px-2 py-1 text-sm"
                      onClick={() => removeKidPhone(k.id, i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {(k.phones || []).length === 0 && (
                  <div className="text-xs text-gray-500">No phones added.</div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded border px-3 py-1"
                  onClick={() => removeKid(k.id)}
                >
                  Delete child
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          (Names, IPs, ports, phones are stored <b>locally</b> in your browser.
          They’re not sent to the server. Parental actions use the mapped API
          Child.)
        </div>
      </section>

      {/* Create tasks */}
      <section className="grid gap-3 rounded border p-4">
        <h2 className="font-medium">Create Minor Tasks</h2>

        {/* Select assignees */}
        <div className="grid gap-2">
          <div className="text-sm text-gray-600">
            Select up to {maxKids === 999 ? '∞' : maxKids} children
          </div>
          <div className="flex flex-wrap gap-2">
            {kids.map((k) => {
              const on = selectedKidIds.includes(k.id)
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => toggleKid(k.id)}
                  className={cls(
                    'rounded border px-3 py-1',
                    on && 'bg-black text-white',
                  )}
                >
                  {k.name || '(unnamed)'}
                </button>
              )
            })}
            {kids.length === 0 && (
              <span className="text-xs text-gray-500">
                Add kids above to assign tasks.
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Selected: {selectedKidIds.length}/{maxKids === 999 ? '∞' : maxKids}
          </div>
        </div>

        {/* Task details */}
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Template</span>
            <select
              className="rounded border px-2 py-1"
              value={template}
              onChange={(e) => onPickTemplate(e.target.value)}
            >
              <option value="">(none)</option>
              {TEMPLATES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Title</span>
            <input
              className="rounded border px-2 py-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Recurrence</span>
            <select
              className="rounded border px-2 py-1"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as any)}
            >
              <option value="none">One-time (minutes from now)</option>
              <option value="daily">Daily (at time)</option>
              <option value="weekly">Weekly (day &amp; time)</option>
            </select>
          </label>

          {recurrence === 'none' && (
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">
                Due (minutes from now)
              </span>
              <input
                type="number"
                min={1}
                className="rounded border px-2 py-1"
                value={dueMins}
                onChange={(e) =>
                  setDueMins(parseInt(e.target.value || '0', 10))
                }
              />
            </label>
          )}
          {(recurrence === 'daily' || recurrence === 'weekly') && (
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Time</span>
              <input
                type="time"
                className="rounded border px-2 py-1"
                value={timeHHMM}
                onChange={(e) => setTimeHHMM(e.target.value)}
              />
            </label>
          )}
          {recurrence === 'weekly' && (
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Day of week</span>
              <select
                className="rounded border px-2 py-1"
                value={weeklyDOW}
                onChange={(e) => setWeeklyDOW(parseInt(e.target.value, 10))}
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </label>
          )}
        </div>

        {/* options */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ackRequired}
              onChange={(e) => setAckRequired(e.target.checked)}
            />{' '}
            Ack required
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={photoProof}
              onChange={(e) => setPhotoProof(e.target.checked)}
            />{' '}
            Photo proof
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoEnforce}
              onChange={(e) => setAutoEnforce(e.target.checked)}
            />{' '}
            Auto enforce on overdue
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>Auto action</span>
            <select
              className="rounded border px-2 py-1"
              value={autoAction}
              onChange={(e) => setAutoAction(e.target.value as ActionV)}
            >
              {ACTIONS.map((a) => (
                <option key={a.v} value={a.v}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-2">
          <button
            className="rounded border px-3 py-1"
            onClick={createMinorTasks}
            disabled={busy || selectedKidIds.length === 0}
          >
            Save
          </button>
          <button
            className="rounded border px-3 py-1"
            onClick={resetForm}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </section>

      {/* Parental Enforce */}
      <section className="grid gap-2 rounded border p-4">
        <h2 className="font-medium">Parental Enforce</h2>
        <div className="grid gap-3">
          {kids.length === 0 && (
            <div className="text-sm text-gray-500">
              Add kids above and map them to API Child users.
            </div>
          )}
          {kids.map((k) => {
            const apiUserId = k.apiUserId || childUsers[0]?.id
            return (
              <div key={k.id} className="grid gap-2 rounded border p-3">
                <div className="font-medium">
                  {k.name || '(unnamed)'}{' '}
                  <span className="text-xs text-gray-500">
                    IP: {k.ip || '-'}:{k.port ?? '-'} • Phones:{' '}
                    {(k.phones || []).filter(Boolean).join(', ') || '-'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ACTIONS.map((a) => (
                    <button
                      key={a.v}
                      className="rounded border px-2 py-1"
                      disabled={!apiUserId}
                      onClick={() => enforce(apiUserId!, a.v, 'Admin')}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tasks table */}
      <section className="grid gap-2 rounded border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Tasks</h2>
          <button className="rounded border px-3 py-1" onClick={loadAll}>
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Assignee</th>
                <th className="py-2 pr-4">Due</th>
                <th className="py-2 pr-4">Minor</th>
                <th className="py-2 pr-4">Ack</th>
                <th className="py-2 pr-4">Proof</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="py-2 pr-4">{t.title}</td>
                  <td className="py-2 pr-4">{t.assignedTo || '-'}</td>
                  <td className="py-2 pr-4">
                    {t.due ? new Date(t.due).toLocaleString() : '-'}
                  </td>
                  <td className="py-2 pr-4">
                    {t.forMinor ? `stage ${t.__minorStage ?? 0}` : '-'}
                  </td>
                  <td className="py-2 pr-4">{t.ackBy || '-'}</td>
                  <td className="py-2 pr-4">
                    {t.proofKey ? t.proofKey.split('/').slice(-1)[0] : '-'}
                  </td>
                  <td className="py-2">
                    <button
                      className="mr-2 rounded border px-2 py-1"
                      onClick={() => ackTask(t.id)}
                    >
                      Ack
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td className="py-4 text-gray-500" colSpan={7}>
                    No tasks
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="text-xs text-gray-500">
        Connected to API at {API} as <b>{acting}</b>
      </footer>
    </div>
  )
}
