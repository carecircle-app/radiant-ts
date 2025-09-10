"use client";
import React, { useEffect, useMemo, useState } from "react";
const [lastEnforceAt, setLastEnforceAt] = useState(0);
const ENFORCE_COOLDOWN_MS = 800;

/**
 * Admin Panel – multi-kid, plan-gated chores & parental controls
 * - Local "Kids" (name/IP/phone, up to 5) saved in browser (no backend schema changes needed)
 * - Plan: Free(1), Lite(2), Elite(∞) – enforced at assignment time
 * - Task templates + custom title, Save/Cancel, one-time/daily/weekly scheduling
 * - Ack & Photo-proof toggles
 * - Parental enforce: play_loud_alert / screen_lock / network_pause / device_restart / app_restart
 * - Maps each local kid to an existing API Child user (dropdown). If none mapped, we fall back
 *   to the first Child user from the API for task creation (and warn).
 */

const API = "http://127.0.0.1:4000";


// ---------- tiny helpers ----------
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
function cls(...a: Array<string | false | undefined>) {
  return a.filter(Boolean).join(" ");
}
function parseTimeHHMM(s: string) {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { h: 8, m: 0 };
  return {
    h: Math.min(23, Math.max(0, parseInt(m[1], 10))),
    m: Math.min(59, Math.max(0, parseInt(m[2], 10))),
  };
}
function nextAtDaily(hour: number, minute: number) {
  const now = new Date();
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d.getTime();
}
function nextAtWeekly(dow: number, hour: number, minute: number) {
  // 0=Sun..6=Sat
  const now = new Date();
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  const delta = (dow - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + delta);
  return d.getTime();
}

// ---------- types (relaxed) ----------
type Role = "Owner" | "Family" | "Child" | "Minor" | "Caregiver" | "Relative";
type User = { id: string; name: string; role: Role };
type Task = {
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
  repeat?: "none" | "daily" | "weekly";
};

type PlanKey = "free" | "lite" | "elite";
const planLimits: Record<PlanKey, number> = { free: 1, lite: 2, elite: 999 };

// Local kid record (stored in browser)
type LocalKid = {
  id: string;           // local UUID
  name: string;
  apiUserId?: string;   // maps to an API "Child" user id
  ip?: string;
  phone?: string;
  notes?: string;
};

const LSK_KIDS = "admin.localKids.v1";
const LSK_OWNER = "admin.ownerLabel.v1";
const LSK_PLAN  = "admin.plan.v1";

// Common chore templates
const TEMPLATES = [
  "Clean room",
  "Wash dishes",
  "Take out trash",
  "Mow the yard",
  "Do homework",
  "Soccer practice",
  "Laundry",
  "Feed pets",
  "Read 20 minutes",
  "Practice instrument",
];

export default function AdminPage() {
  // Acting user (auth header)
  const [acting, setActing] = useState<string>("u-owner");
  const hdr = useMemo(() => ({ "x-user-id": acting }), [acting]);

  // API data
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const childUsers = users.filter((u) => u.role === "Child" || u.role === "Minor");

  // Owner/household label
  const [ownerLabel, setOwnerLabel] = useState<string>("");

  // Plan gating
  const [plan, setPlan] = useState<PlanKey>("elite");
  const maxKids = planLimits[plan];

  // Local kids (managed entirely client-side, up to 5)
  const [kids, setKids] = useState<LocalKid[]>([]);
  useEffect(() => {
    try {
      const rawKids = localStorage.getItem(LSK_KIDS);
      if (rawKids) setKids(JSON.parse(rawKids));
      const rawOwner = localStorage.getItem(LSK_OWNER);
      if (rawOwner) setOwnerLabel(rawOwner);
      const rawPlan = localStorage.getItem(LSK_PLAN) as PlanKey | null;
      if (rawPlan) setPlan(rawPlan);
    } catch {}
  }, []);
  function persistKids(next: LocalKid[]) {
    setKids(next);
    try { localStorage.setItem(LSK_KIDS, JSON.stringify(next)); } catch {}
  }
  function persistOwner(label: string) {
    setOwnerLabel(label);
    try { localStorage.setItem(LSK_OWNER, label); } catch {}
  }
  function persistPlan(p: PlanKey) {
    setPlan(p);
    try { localStorage.setItem(LSK_PLAN, p); } catch {}
  }

  // Task creation state
  const [template, setTemplate] = useState<string>("");
  const [title, setTitle] = useState<string>("Clean room");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">("none");
  const [dueMins, setDueMins] = useState<number>(15);
  const [weeklyDOW, setWeeklyDOW] = useState<number>(1);
  const [timeHHMM, setTimeHHMM] = useState<string>("08:00");
  const [ackRequired, setAckRequired] = useState<boolean>(true);
  const [photoProof, setPhotoProof] = useState<boolean>(true);
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function resetForm() {
    setTemplate("");
    setTitle("Clean room");
    setRecurrence("none");
    setDueMins(15);
    setWeeklyDOW(1);
    setTimeHHMM("08:00");
    setAckRequired(true);
    setPhotoProof(true);
    setSelectedKidIds([]);
  }

  function toggleKid(id: string) {
    if (selectedKidIds.includes(id)) {
      setSelectedKidIds(selectedKidIds.filter((x) => x !== id));
      return;
    }
    if (selectedKidIds.length >= maxKids) {
      alert(`Your plan (${plan}) allows up to ${maxKids === 999 ? "unlimited" : maxKids} child${maxKids > 1 ? "ren" : ""}.`);
      return;
    }
    setSelectedKidIds([...selectedKidIds, id]);
  }

  // Load API data
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

  // Create tasks
  async function createMinorTasks() {
    if (!title.trim()) return alert("Title is required.");
    if (selectedKidIds.length === 0) return alert("Select at least one child.");
    if (childUsers.length === 0) return alert("No API 'Child' users found. Add at least one child user to the circle first.");

    setBusy(true);
    try {
      // Resolve default apiUserId if a local kid has none
      const defaultChildId = childUsers[0]?.id;

      const { h, m } = parseTimeHHMM(timeHHMM);
      const posts: Promise<any>[] = [];

      for (const localId of selectedKidIds) {
        const kid = kids.find((k) => k.id === localId);
        const apiUserId = kid?.apiUserId || defaultChildId;
        if (!apiUserId) continue;

        let due: number;
        if (recurrence === "none") due = Date.now() + Math.max(1, dueMins) * 60_000;
        else if (recurrence === "daily") due = nextAtDaily(h, m);
        else due = nextAtWeekly(weeklyDOW, h, m);

        posts.push(
          fetch(`${API}/api/tasks`, {
            method: "POST",
            headers: { ...hdr, "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              due,
              assignedTo: apiUserId,
              forMinor: true,
              ackRequired,
              photoProof,
              repeat: recurrence,
            }),
          }).then(j)
        );
      }
      await Promise.all(posts);
      alert(`Created ${selectedKidIds.length} task(s) ✅`);
      await loadAll();
      resetForm();
    } catch (e) {
      alert("Create failed: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Task ACK
  async function ackTask(id: string) {
    try {
      await fetch(`${API}/api/tasks/${id}/ack`, { method: "POST", headers: hdr }).then(j);
      await loadAll();
    } catch (e) {
      alert("ACK failed: " + (e as Error).message);
    }
  }

  // Parental enforce
  async function enforce(apiUserId: string, action: string, reason: string) {
    try {
      await fetch(`${API}/api/parental/enforce`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: apiUserId, action, reason }),
      }).then(j);
      alert(`Enforce sent: ${action} ✅`);
    } catch (e) {
  console.warn(e);
  alert("Could not reach the API. Check NEXT_PUBLIC_API_URL or server status.")
}
}// Owner label change (stored locally)
  function onOwnerLabelChange(v: string) { persistOwner(v); }

  // Template picker
  function onPickTemplate(v: string) { setTemplate(v); if (v) setTitle(v); }

  // Add new local kid (up to 5)
  function addKid() {
    if (kids.length >= 5) return alert("You can keep up to 5 local kids.");
    const id = "k-" + Math.random().toString(36).slice(2, 8);
    const next = [...kids, { id, name: "New child" }];
    persistKids(next);
  }
  function removeKid(id: string) {
    const next = kids.filter(k => k.id !== id);
    persistKids(next);
    setSelectedKidIds(selectedKidIds.filter(x=>x!==id));
  }
  function updateKid(id: string, patch: Partial<LocalKid>) {
    persistKids(kids.map(k => k.id === id ? { ...k, ...patch } : k));
  }

  return (
    <div className="min-h-dvh p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Household / Owner</span>
            <input
              className="border rounded px-2 py-1"
              placeholder="e.g. Mom & Dad"
              value={ownerLabel}
              onChange={(e)=> onOwnerLabelChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Acting user</span>
          <select className="border rounded px-2 py-1" value={acting} onChange={(e)=> setActing(e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            {users.length===0 && (<>
              <option value="u-owner">Owner (Owner)</option>
              <option value="u-child">Derek (Child)</option>
              <option value="u-fam">Ryan (Family)</option>
            </>)}
          </select>
          <button className="ml-2 border rounded px-3 py-1" onClick={loadAll}>Refresh</button>
        </div>
      </header>

      {/* Plan gating */}
      <section className="grid gap-2 border rounded p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Plan</span>
          <select className="border rounded px-2 py-1" value={plan} onChange={(e)=> persistPlan(e.target.value as PlanKey)}>
            <option value="free">Free (1 child)</option>
            <option value="lite">Lite (2 children)</option>
            <option value="elite">Elite (unlimited)</option>
          </select>
          <span className="text-xs text-gray-500">Max assignees per task: {maxKids === 999 ? "unlimited" : maxKids}</span>
        </div>
      </section>

      {/* Local Kids (name/IP/phone; map to API child) */}
      <section className="grid gap-3 border rounded p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Kids (local, max 5)</h2>
          <button className="border rounded px-3 py-1" onClick={addKid} disabled={kids.length>=5}>Add child</button>
        </div>
        <div className="grid gap-3">
          {kids.length===0 && <div className="text-sm text-gray-500">No kids yet. Click “Add child”.</div>}
          {kids.map(k => (
            <div key={k.id} className="border rounded p-3 grid md:grid-cols-5 gap-2 items-end">
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Name</span>
                <input className="border rounded px-2 py-1" value={k.name||""} onChange={(e)=> updateKid(k.id, {name:e.target.value})}/>
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Map to API Child</span>
                <select className="border rounded px-2 py-1" value={k.apiUserId||""} onChange={(e)=> updateKid(k.id,{apiUserId:e.target.value||undefined})}>
                  <option value="">(auto choose first Child)</option>
                  {childUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Device IP</span>
                <input className="border rounded px-2 py-1" placeholder="e.g. 192.168.1.42" value={k.ip||""} onChange={(e)=> updateKid(k.id,{ip:e.target.value})}/>
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-gray-600">Phone #</span>
                <input className="border rounded px-2 py-1" placeholder="e.g. 555-123-4567" value={k.phone||""} onChange={(e)=> updateKid(k.id,{phone:e.target.value})}/>
              </label>
              <div className="flex gap-2">
                <button className="border rounded px-3 py-1" onClick={()=> removeKid(k.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          (Names, IPs, phones are stored **locally** in your browser. They’re not sent to the server. Parental actions still use your API Child mapping.)
        </div>
      </section>

      {/* Create tasks */}
      <section className="grid gap-3 border rounded p-4">
        <h2 className="font-medium">Create Minor Tasks</h2>

        {/* Choose assignees (respect plan limit) */}
        <div className="grid gap-2">
          <div className="text-sm text-gray-600">Select up to {maxKids === 999 ? "∞" : maxKids} children</div>
          <div className="flex flex-wrap gap-2">
            {kids.map(k=>{
              const on = selectedKidIds.includes(k.id);
              return (
                <button key={k.id} type="button" onClick={()=> toggleKid(k.id)}
                        className={cls("px-3 py-1 border rounded", on && "bg-black text-white")}>
                  {k.name || "(unnamed)"}
                </button>
              );
            })}
            {kids.length===0 && <span className="text-xs text-gray-500">Add kids above to assign tasks.</span>}
          </div>
          <div className="text-xs text-gray-500">Selected: {selectedKidIds.length}/{maxKids === 999 ? "∞" : maxKids}</div>
        </div>

        {/* Task details */}
        <div className="grid md:grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Template</span>
            <select className="border rounded px-2 py-1" value={template} onChange={(e)=> onPickTemplate(e.target.value)}>
              <option value="">(none)</option>
              {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Title</span>
            <input className="border rounded px-2 py-1" value={title} onChange={(e)=> setTitle(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Recurrence</span>
            <select className="border rounded px-2 py-1" value={recurrence} onChange={(e)=> setRecurrence(e.target.value as any)}>
              <option value="none">One-time (minutes from now)</option>
              <option value="daily">Daily (at time)</option>
              <option value="weekly">Weekly (day &amp; time)</option>
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
                <option value={0}>Sunday</option><option value={1}>Monday</option><option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option><option value={4}>Thursday</option><option value={5}>Friday</option>
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
          <button className="border rounded px-3 py-1" onClick={createMinorTasks} disabled={busy || selectedKidIds.length===0}>Save</button>
          <button className="border rounded px-3 py-1" onClick={resetForm} disabled={busy}>Cancel</button>
        </div>
      </section>

      {/* Parental Enforce */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Parental Enforce</h2>
        <div className="grid gap-3">
          {kids.length===0 && <div className="text-sm text-gray-500">Add kids above and map them to API Child users.</div>}
          {kids.map(k => {
            const apiUserId = k.apiUserId || childUsers[0]?.id;
            return (
              <div key={k.id} className="border rounded p-3 grid gap-2">
                <div className="font-medium">{k.name || "(unnamed)"} <span className="text-xs text-gray-500">IP: {k.ip || "-"}, Phone: {k.phone || "-"}</span></div>
                <div className="flex flex-wrap gap-2">
                  <button className="border rounded px-2 py-1" disabled={!apiUserId} onClick={()=> enforce(apiUserId!, "play_loud_alert", "Admin")}>Loud alert</button>
                  <button className="border rounded px-2 py-1" disabled={!apiUserId} onClick={()=> enforce(apiUserId!, "screen_lock", "Admin")}>Lock screen</button>
                  <button className="border rounded px-2 py-1" disabled={!apiUserId} onClick={()=> enforce(apiUserId!, "network_pause", "Admin")}>Pause network</button>
                  <button className="border rounded px-2 py-1" disabled={!apiUserId} onClick={()=> enforce(apiUserId!, "device_restart", "Admin")}>Device restart</button>
                  <button className="border rounded px-2 py-1" disabled={!apiUserId} onClick={()=> enforce(apiUserId!, "app_restart", "Admin")}>App restart</button>
                </div>
              </div>
            );
          })}
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
              {tasks.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="py-2 pr-4">{t.title}</td>
                  <td className="py-2 pr-4">{t.assignedTo || "-"}</td>
                  <td className="py-2 pr-4">{t.due ? new Date(t.due).toLocaleString() : "-"}</td>
                  <td className="py-2 pr-4">{t.forMinor ? `stage ${t.__minorStage ?? 0}` : "-"}</td>
                  <td className="py-2 pr-4">{t.ackBy || "-"}</td>
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

      <footer className="text-xs text-gray-500">
        Connected to API at {API} as <b>{acting}</b>
      </footer>
    </div>
  );
}
