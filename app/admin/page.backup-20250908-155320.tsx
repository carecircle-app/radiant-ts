"use client";
import React, { useEffect, useMemo, useState } from "react";

/** ---------------------------------------------------------------
 * Simple Admin panel (Next.js client component)
 * - Multi-child (up to 5), plan-gated (Free=1, Lite=2, Elite=)
 * - Create minor tasks: none/daily/weekly (choose day/time)
 * - Save / Cancel
 * - ACK per task
 * - Parental Enforce: play_loud_alert / screen_lock / network_pause / device_restart / app_restart
 * - Child Device IPs (localStorage persistence; for future agent use)
 * --------------------------------------------------------------*/

const API = "http://127.0.0.1:4000";

// small helpers
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
function cls(...a: Array<string | false | undefined>) {
  return a.filter(Boolean).join(" ");
}

type Role = "Owner" | "Family" | "Child" | "Caregiver" | "Relative";
type User = { id: string; name: string; role: Role };

interface Task {
  id: string;
  title: string;
  circleId: string;
  assignedTo?: string;
  due?: number;
  completed?: boolean;
  proofKey?: string;
  forMinor?: boolean;
  ackRequired?: boolean;
  photoProof?: boolean;
  ackAt?: number;
  ackBy?: string;
  __minorStage?: 0 | 1 | 2 | 3 | 4;
}

type PlanKey = "free" | "lite" | "elite";
const planLimits: Record<PlanKey, number> = { free: 1, lite: 2, elite: 999 };

function parseTimeHHMM(s: string): { h: number; m: number } {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { h: 8, m: 0 };
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { h, m: min };
}

function nextAtDaily(hour: number, minute: number): number {
  const now = new Date();
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d.getTime();
}
function nextAtWeekly(dow: number, hour: number, minute: number): number {
  // dow: 0=Sun..6=Sat
  const now = new Date();
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  const delta = (dow - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + delta);
  return d.getTime();
}

type DeviceMap = Record<string, string>; // userId -> IP

export default function AdminPage() {
  // acting user header (defaults to owner)
  const [acting, setActing] = useState<string>("u-owner");
  const hdr = useMemo(() => ({ "x-user-id": acting }), [acting]);

  // users/tasks
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const childUsers = users.filter((u) => u.role === "Child");

  // plan gating
  const [plan, setPlan] = useState<PlanKey>("elite"); // choose free/lite/elite
  const maxKids = planLimits[plan];

  // form: task creation
  const [title, setTitle] = useState("Clean room");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">("none");
  const [dueMins, setDueMins] = useState<number>(15);
  const [weeklyDOW, setWeeklyDOW] = useState<number>(1); // Monday
  const [timeHHMM, setTimeHHMM] = useState<string>("08:00");
  const [ackRequired, setAckRequired] = useState(true);
  const [photoProof, setPhotoProof] = useState(true);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const selectedCount = selectedKids.length;

  // save/cancel guard
  const [busy, setBusy] = useState(false);

  // device IPs local storage
  const [deviceIPs, setDeviceIPs] = useState<DeviceMap>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem("childDeviceIPs");
      if (raw) setDeviceIPs(JSON.parse(raw));
    } catch {}
  }, []);
  function persistIPs(next: DeviceMap) {
    setDeviceIPs(next);
    try { localStorage.setItem("childDeviceIPs", JSON.stringify(next)); } catch {}
  }

  async function loadAll() {
    try {
      const [u, t] = await Promise.all([
        fetch(`${API}/api/users`, { headers: hdr }).then(j<User[]>),
        fetch(`${API}/api/tasks`, { headers: hdr }).then(j<Task[]>),
      ]);
      setUsers(u);
      setTasks(t);
    } catch (e) {
      alert("Load failed: " + (e as Error).message);
    }
  }
  useEffect(() => { loadAll(); }, [acting]);

  // selection logic (respect plan limit)
  function toggleKid(id: string) {
    if (selectedKids.includes(id)) {
      setSelectedKids(selectedKids.filter(x => x !== id));
      return;
    }
    if (selectedKids.length >= maxKids) {
      alert(`Your plan (${plan}) allows up to ${maxKids} child${maxKids>1?"ren":""}.`);
      return;
    }
    setSelectedKids([...selectedKids, id]);
  }

  function resetForm() {
    setTitle("Clean room");
    setRecurrence("none");
    setDueMins(15);
    setWeeklyDOW(1);
    setTimeHHMM("08:00");
    setAckRequired(true);
    setPhotoProof(true);
    setSelectedKids([]);
  }

  async function createMinorTasks() {
    if (!title.trim()) { alert("Title is required"); return; }
    if (selectedKids.length === 0) { alert("Select at least one child"); return; }
    setBusy(true);
    try {
      const { h, m } = parseTimeHHMM(timeHHMM);
      const posts: Promise<any>[] = [];
      for (const kidId of selectedKids) {
        let due: number;
        if (recurrence === "none") {
          due = Date.now() + Math.max(1, dueMins) * 60_000;
        } else if (recurrence === "daily") {
          due = nextAtDaily(h, m);
        } else {
          due = nextAtWeekly(weeklyDOW, h, m);
        }
        posts.push(
          fetch(`${API}/api/tasks`, {
            method: "POST",
            headers: { ...hdr, "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              due,
              assignedTo: kidId,
              forMinor: true,
              ackRequired,
              photoProof,
              repeat: recurrence,
            }),
          }).then(j)
        );
      }
      await Promise.all(posts);
      alert(`Created ${selectedKids.length} task(s) `);
      await loadAll();
      resetForm();
    } catch (e) {
      alert("Create failed: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function ackTask(id: string) {
    try {
      await fetch(`${API}/api/tasks/${id}/ack`, { method: "POST", headers: hdr }).then(j);
      await loadAll();
    } catch (e) {
      alert("ACK failed: " + (e as Error).message);
    }
  }

  async function enforce(targetUserId: string, action: string, reason: string) {
    try {
      await fetch(`${API}/api/parental/enforce`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action, reason }),
      }).then(j);
      alert(`Enforce sent: ${action} `);
    } catch (e) {
      alert("Enforce failed: " + (e as Error).message);
    }
  }

  // UI
  return (
    <div className="min-h-dvh p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Acting user</span>
          <select className="border rounded px-2 py-1" value={acting} onChange={(e)=> setActing(e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            {users.length===0 && (
              <>
                <option value="u-owner">Owner (Owner)</option>
                <option value="u-child">Derek (Child)</option>
                <option value="u-fam">Ryan (Family)</option>
              </>
            )}
          </select>
          <button className="ml-2 border rounded px-3 py-1" onClick={loadAll}>Refresh</button>
        </div>
      </header>

      {/* Plan gating */}
      <section className="grid gap-2 border rounded p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Plan</span>
          <select className="border rounded px-2 py-1" value={plan} onChange={(e)=> setPlan(e.target.value as PlanKey)}>
            <option value="free">Free (1 child)</option>
            <option value="lite">Lite (2 children)</option>
            <option value="elite">Elite (unlimited)</option>
          </select>
          <span className="text-xs text-gray-500">Max children: {maxKids === 999 ? "unlimited" : maxKids}</span>
        </div>
      </section>

      {/* Device IPs */}
      <section className="grid gap-3 border rounded p-4">
        <h2 className="font-medium">Child Devices (IPs)</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {childUsers.length === 0 && <div className="text-sm text-gray-500">No Child users found.</div>}
          {childUsers.map(u => (
            <label key={u.id} className="grid gap-1">
              <span className="text-sm text-gray-600">{u.name} ({u.id})</span>
              <input
                className="border rounded px-2 py-1"
                placeholder="e.g. 192.168.1.42"
                value={deviceIPs[u.id] || ""}
                onChange={(e)=>{
                  const next = { ...deviceIPs, [u.id]: e.target.value };
                  persistIPs(next);
                }}
              />
            </label>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          (IPs are stored locally in your browser. Well hook agents to these later.)
        </div>
      </section>

      {/* Create Minor Tasks */}
      <section className="grid gap-3 border rounded p-4">
        <h2 className="font-medium">Create Minor Tasks</h2>

        {/* Child selection with plan limit */}
        <div className="grid gap-2">
          <div className="text-sm text-gray-600">Select up to {maxKids === 999 ? "" : maxKids} children</div>
          <div className="flex flex-wrap gap-2">
            {childUsers.map(u => {
              const on = selectedKids.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={()=> toggleKid(u.id)}
                  className={cls(
                    "px-3 py-1 border rounded",
                    on && "bg-black text-white"
                  )}
                >
                  {u.name}
                </button>
              );
            })}
            {childUsers.length===0 && <span className="text-xs text-gray-500">No Child users</span>}
          </div>
          <div className="text-xs text-gray-500">Selected: {selectedCount}/{maxKids === 999 ? "" : maxKids}</div>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Title</span>
            <input className="border rounded px-2 py-1" value={title} onChange={(e)=> setTitle(e.target.value)} />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Recurrence</span>
            <select className="border rounded px-2 py-1" value={recurrence} onChange={(e)=> setRecurrence(e.target.value as any)}>
              <option value="none">One-time (minutes from now)</option>
              <option value="daily">Daily (at time)</option>
              <option value="weekly">Weekly (day & time)</option>
            </select>
          </label>

          {recurrence === "none" && (
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Due (minutes from now)</span>
              <input type="number" min={1} className="border rounded px-2 py-1" value={dueMins} onChange={(e)=> setDueMins(parseInt(e.target.value||"0",10))} />
            </label>
          )}
          {(recurrence === "daily" || recurrence === "weekly") && (
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Time</span>
              <input type="time" className="border rounded px-2 py-1" value={timeHHMM} onChange={(e)=> setTimeHHMM(e.target.value)} />
            </label>
          )}
          {recurrence === "weekly" && (
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Day of week</span>
              <select className="border rounded px-2 py-1" value={weeklyDOW} onChange={(e)=> setWeeklyDOW(parseInt(e.target.value,10))}>
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
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ackRequired} onChange={(e)=> setAckRequired(e.target.checked)} /> Ack required</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={photoProof} onChange={(e)=> setPhotoProof(e.target.checked)} /> Photo proof</label>
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-2">
          <button className="border rounded px-3 py-1" onClick={createMinorTasks} disabled={busy || selectedKids.length===0}>Save</button>
          <button className="border rounded px-3 py-1" onClick={resetForm} disabled={busy}>Cancel</button>
        </div>
      </section>

      {/* Parental Enforce */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Parental Enforce</h2>
        <div className="flex flex-wrap gap-3">
          {childUsers.map(u => (
            <div key={u.id} className="border rounded p-3 grid gap-2">
              <div className="font-medium">{u.name}</div>
              <div className="flex flex-wrap gap-2">
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "play_loud_alert", "Admin")}>Loud alert</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "screen_lock", "Admin")}>Lock screen</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "network_pause", "Admin")}>Pause network</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "device_restart", "Admin")}>Device restart</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "app_restart", "Admin")}>App restart</button>
              </div>
              <div className="text-xs text-gray-500">
                Device IP: {deviceIPs[u.id] || "-"}
              </div>
            </div>
          ))}
          {childUsers.length===0 && <div className="text-sm text-gray-500">No Child users found.</div>}
        </div>
      </section>

      {/* Tasks table */}
      <section className="grid gap-2 border rounded p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Tasks</h2>
          <button className="border rounded px-3 py-1" onClick={loadAll}>Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
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
              {tasks.map(t => (
                <tr key={t.id} className="border-b">
                  <td className="py-2 pr-4">{t.title}</td>
                  <td className="py-2 pr-4">{t.assignedTo || "-"}</td>
                  <td className="py-2 pr-4">{t.due ? new Date(t.due).toLocaleString() : "-"}</td>
                  <td className="py-2 pr-4">{t.forMinor ? `stage ${t.__minorStage ?? 0}` : "-"}</td>
                  <td className="py-2 pr-4">{t.ackBy ? t.ackBy : "-"}</td>
                  <td className="py-2 pr-4">{t.proofKey ? t.proofKey.split("/").slice(-1)[0] : "-"}</td>
                  <td className="py-2">
                    <button className="border rounded px-2 py-1 mr-2" onClick={()=> ackTask(t.id)}>Ack</button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td className="py-4 text-gray-500" colSpan={7}>No tasks</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="text-xs text-gray-500">Connected to API at {API} as <b>{acting}</b></footer>
    </div>
  );
}
