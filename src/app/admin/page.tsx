'use client'
import { useEffect, useMemo, useState } from 'react'

/** ---- tiny helpers ---- */
const API = 'http://127.0.0.1:4000' // backend API base

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/** ---- types (relaxed to match API) ---- */
type User = { id: string; name: string; role: string }
interface Task {
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
}

export default function AdminPage() {
  /** acting user header (defaults to owner) */
  const [acting, setActing] = useState<string>('u-owner')
  const hdr = useMemo(() => ({ 'x-user-id': acting }), [acting])

  /** data state */
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  /** form state (create task) */
  const [title, setTitle] = useState('Clean desk')
  const [assignee, setAssignee] = useState<string>('u-child')
  const [dueMins, setDueMins] = useState<number>(2)
  const [ackRequired, setAckRequired] = useState(true)
  const [photoProof, setPhotoProof] = useState(true)

  /** form state (upload proof) */
  const [proofTaskId, setProofTaskId] = useState<string>('')
  const [proofFile, setProofFile] = useState<File | null>(null)

  const childUsers = users.filter((u) => u.role === 'Child')

  /** load users + tasks */
  async function loadAll() {
    setLoading(true)
    try {
      const u = await fetch(`${API}/api/users`, { headers: hdr }).then((res) =>
        j<User[]>(res),
      )
      const t = await fetch(`${API}/api/tasks`, { headers: hdr }).then((res) =>
        j<Task[]>(res),
      )
      setUsers(u)
      setTasks(t)

      // keep a valid default assignee
      if (!u.find((x) => x.id === assignee)) {
        const child = u.find((x) => x.role === 'Child')
        if (child) setAssignee(child.id)
      }
    } catch (err) {
      console.error(err)
      alert('Load failed: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [acting]) // reload when acting user changes

  /** ---- actions ---- */
  async function createMinorTask() {
    const due = Date.now() + Math.max(1, Number(dueMins || 0)) * 60_000
    try {
      await fetch(`${API}/api/tasks`, {
        method: 'POST',
        headers: { ...hdr, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          due,
          assignedTo: assignee,
          forMinor: true,
          ackRequired,
          photoProof,
        }),
      }).then((res) => j(res))
      alert('Task created âœ…')
      await loadAll()
    } catch (e) {
      alert('Create failed: ' + (e as Error).message)
    }
  }

  async function ackTask(id: string) {
    try {
      await fetch(`${API}/api/tasks/${id}/ack`, {
        method: 'POST',
        headers: hdr,
      }).then((res) => j(res))
      alert('ACK sent âœ…')
      await loadAll()
    } catch (e) {
      alert('ACK failed: ' + (e as Error).message)
    }
  }

  async function enforce(targetUserId: string, action: string, reason: string) {
    try {
      await fetch(`${API}/api/parental/enforce`, {
        method: 'POST',
        headers: { ...hdr, 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action, reason }),
      }).then((res) => j(res))
      alert(`Enforce sent: ${action} âœ…`)
    } catch (e) {
      alert('Enforce failed: ' + (e as Error).message)
    }
  }

  async function uploadProof() {
    if (!proofTaskId || !proofFile) {
      alert('Pick a task and a file first')
      return
    }
    try {
      // 1) presign
      const pres = await fetch(`${API}/api/uploads/presign`, {
        method: 'POST',
        headers: { ...hdr, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: proofFile.name,
          fileType: proofFile.type || 'application/octet-stream',
          fileSize: proofFile.size,
        }),
      }).then((res) => j<{ ok: boolean; url: string; key: string }>(res))

      // 2) raw PUT to local server
      await fetch(pres.url, {
        method: 'PUT',
        headers: {
          'Content-Type': proofFile.type || 'application/octet-stream',
        },
        body: proofFile,
      })

      // 3) complete
      await fetch(`${API}/api/uploads/complete`, {
        method: 'POST',
        headers: { ...hdr, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: pres.key,
          size: proofFile.size,
          mime: proofFile.type || 'application/octet-stream',
        }),
      }).then((res) => j(res))

      // 4) attach to task
      await fetch(`${API}/api/tasks/${proofTaskId}/proof`, {
        method: 'POST',
        headers: { ...hdr, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: pres.key }),
      }).then((res) => j(res))

      alert('Proof uploaded & attached âœ…')
      setProofFile(null)
      setProofTaskId('')
      await loadAll()
    } catch (e) {
      alert('Upload failed: ' + (e as Error).message)
    }
  }

  return (
    <div
      className="min-h-dvh space-y-8 p-6"
      style={{ fontFamily: 'ui-sans-serif, system-ui' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-2">
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
          <button
            className="ml-2 rounded border px-3 py-1"
            disabled={loading}
            onClick={loadAll}
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Create Minor Task */}
      <section className="grid gap-2 rounded border p-4">
        <h2 className="font-medium">Create Minor Task</h2>
        <div className="grid items-end gap-3 md:grid-cols-4">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Title</span>
            <input
              className="rounded border px-2 py-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Assignee</span>
            <select
              className="rounded border px-2 py-1"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
              {users.length === 0 && (
                <option value="u-child">Derek (Child)</option>
              )}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">
              Due (minutes from now)
            </span>
            <input
              type="number"
              className="rounded border px-2 py-1"
              value={dueMins}
              onChange={(e) => setDueMins(Number(e.target.value || '0'))}
            />
          </label>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ackRequired}
                onChange={(e) => setAckRequired(e.target.checked)}
              />
              Ack required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={photoProof}
                onChange={(e) => setPhotoProof(e.target.checked)}
              />
              Photo proof
            </label>
          </div>
        </div>

        <div>
          <button
            className="rounded border px-3 py-1"
            onClick={createMinorTask}
            disabled={loading}
          >
            Create
          </button>
        </div>
      </section>

      {/* Parental Enforce */}
      <section className="grid gap-2 rounded border p-4">
        <h2 className="font-medium">Parental Enforce</h2>
        {childUsers.length === 0 && (
          <div className="text-sm text-gray-500">No Child users found.</div>
        )}
        <div className="flex flex-wrap gap-3">
          {childUsers.map((u) => (
            <div key={u.id} className="grid gap-2 rounded border p-3">
              <div className="font-medium">{u.name}</div>
              <div className="flex gap-2">
                <button
                  className="rounded border px-2 py-1"
                  onClick={() => enforce(u.id, 'play_loud_alert', 'Admin page')}
                >
                  Loud alert
                </button>
                <button
                  className="rounded border px-2 py-1"
                  onClick={() => enforce(u.id, 'screen_lock', 'Admin page')}
                >
                  Lock screen
                </button>
                <button
                  className="rounded border px-2 py-1"
                  onClick={() => enforce(u.id, 'network_pause', 'Admin page')}
                >
                  Pause network
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upload Photo Proof */}
      <section className="grid gap-2 rounded border p-4">
        <h2 className="font-medium">Upload Photo Proof</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded border px-2 py-1"
            value={proofTaskId}
            onChange={(e) => setProofTaskId(e.target.value)}
          >
            <option value="">Select taskâ€¦</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <input
            type="file"
            onChange={(e) => setProofFile(e.currentTarget.files?.[0] ?? null)}
          />
          <button
            className="rounded border px-3 py-1"
            onClick={uploadProof}
            disabled={!proofTaskId || !proofFile}
          >
            Upload proof
          </button>
        </div>
      </section>

      {/* Tasks table */}
      <section className="grid gap-2 rounded border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Tasks</h2>
          <button
            className="rounded border px-3 py-1"
            onClick={loadAll}
            disabled={loading}
          >
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
                    {t.due ? new Date(t.due).toLocaleTimeString() : '-'}
                  </td>
                  <td className="py-2 pr-4">
                    {t.forMinor ? `stage ${t.__minorStage ?? 0}` : '-'}
                  </td>
                  <td className="py-2 pr-4">{t.ackBy ? t.ackBy : '-'}</td>
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
