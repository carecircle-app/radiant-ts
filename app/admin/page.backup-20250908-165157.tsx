/* @ts-nocheck */
"use client";
import React, { useEffect, useMemo, useState } from "react";

/** ---------------------------------------------------------------
 * Admin panel
 * - Plan gating: Free(1) / Lite(2) / Elite(∞)
 * - Manage kids (name, IP, phone, API user mapping); stored in localStorage
 * - Select up to plan limit kids; Save/Cancel
 * - Task templates dropdown + custom title
 * - One-time (minutes), Daily (time), Weekly (day+time)
 * - Photo-proof, Ack-required
 * - Enforce actions: play_loud_alert, screen_lock, network_pause, device_restart, app_restart
 * - Tasks table with Ack
 * --------------------------------------------------------------*/

const API = "http://127.0.0.1:4000";

// helpers
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
function cls(...a: Array<string | false | undefined>) {
  return a.filter(Boolean).join(" ");
}

// types
type Role = "Owner" | "Family" | "Child" | "Caregiver" | "Relative";
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
};
type Kid = { id: string; name: string; ip?: string; phone?: string; apiUserId?: string };

type PlanKey = "free" | "lite" | "elite";
const planLimits: Record<PlanKey, number> = { free: 1, lite: 2, elite: 999 };

const TEMPLATES = [
  "Clean room",
  "Wash dishes",
  "Take out trash",
  "Mow yard",
  "Homework",
  "Soccer practice",
];

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

export default function AdminPage() {
  // acting user header (simulates who calls the API)
  const [acting, setActing] = useState("u-owner");
  const hdr = useMemo(() => ({ "x-user-id": acting }), [acting]);

  // data from API
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const childUsers = users.filter(u => u.role === "Child");

  // plan gating
  const [plan, setPlan] = useState<PlanKey>("elite");
  const maxKids = planLimits[plan];

  // local kid list (admin-defined), persisted in localStorage
  const [kids, setKids] = useState<Kid[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("adminKids_v1");
      if (raw) setKids(JSON.parse(raw));
    } catch {}
  }, []);
  function persistKids(next: Kid[]) {
    setKids(next);
    try { localStorage.setItem("adminKids_v1", JSON.stringify(next)); } catch {}
  }

  // selection
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
  function toggleKid(id: string) {
    if (selectedKidIds.includes(id)) {
      setSelectedKidIds(selectedKidIds.filter(x => x !== id));
      return;
    }
    if (selectedKidIds.length >= maxKids) {
      alert(`Your plan (${plan}) allows up to ${maxKids === 999 ? "unlimited" : maxKids} child${maxKids>1?"ren":""}.`);
      return;
    }
    setSelectedKidIds([...selectedKidIds, id]);
  }

  // kid editor temp state
  const [newKidName, setNewKidName] = useState("");
  const [newKidIP, setNewKidIP] = useState("");
  const [newKidPhone, setNewKidPhone] = useState("");
  const [newKidApiUser, setNewKidApiUser] = useState<string>("");

  function addKid() {
    if (!newKidName.trim()) { alert("Please enter a name"); return; }
    const id = "k-" + Math.random().toString(36).slice(2, 8);
    const k: Kid = { id, name: newKidName.trim(), ip: newKidIP.trim() || undefined, phone: newKidPhone.trim() || undefined, apiUserId: newKidApiUser || undefined };
    const next = [...kids, k];
    persistKids(next);
    setNewKidName(""); setNewKidIP(""); setNewKidPhone(""); setNewKidApiUser("");
  }
  function updateKid(id: string, patch: Partial<Kid>) {
    const next = kids.map(k => k.id === id ? { ...k, ...patch } : k);
    persistKids(next);
  }
  function removeKid(id: string) {
    const next = kids.filter(k => k.id !== id);
    persistKids(next);
    setSelectedKidIds(selectedKidIds.filter(x => x !== id));
  }

  // task creation form
  const [template, setTemplate] = useState<string>("");
  const [title, setTitle] = useState<string>("Clean room");
  function onPickTemplate(val: string) {
    setTemplate(val);
    if (val) setTitle(val);
  }
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">("none");
  const [dueMins, setDueMins] = useState<number>(15);
  const [timeHHMM, setTimeHHMM] = useState<string>("08:00");
  const [weeklyDOW, setWeeklyDOW] = useState<number>(1); // Monday
  const [ackRequired, setAckRequired] = useState(true);
  const [photoProof, setPhotoProof] = useState(true);

  const [busy, setBusy] = useState(false);

  async function loadAll() {
    try {
      const u = await fetch(`${API}/api/users`, { headers: hdr }).then(res => j<User[]>(res));
      const t = await fetch(`${API}/api/tasks`, { headers: hdr }).then(res => j<Task[]>(res));
      setUsers(u); setTasks(t);
    } catch (e) {
      alert("Load failed: " + (e as Error).message);
    }
  }
  useEffect(() => { loadAll(); }, [acting]);

  function resetForm() {
    setTemplate("");
    setTitle("Clean room");
    setRecurrence("none");
    setDueMins(15);
    setTimeHHMM("08:00");
    setWeeklyDOW(1);
    setAckRequired(true);
    setPhotoProof(true);
    setSelectedKidIds([]);
  }

  async function createMinorTasks() {
    if (selectedKidIds.length === 0) { alert("Pick at least one child"); return; }
    if (!title.trim()) { alert("Title is required"); return; }
    setBusy(true);
    try {
      const { h, m } = parseTimeHHMM(timeHHMM);
      const posts: Promise<any>[] = [];

      for (const kidId of selectedKidIds) {
        const kid = kids.find(k => k.id === kidId);
        const apiUserId = kid?.apiUserId || childUsers[0]?.id || "u-child";

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
              assignedTo: apiUserId,
              forMinor: true,
              ackRequired,
              photoProof,
              repeat: recurrence
            }),
          }).then(res => j<any>(res))
        );
      }

      await Promise.all(posts);
      alert(`Created ${selectedKidIds.length} task(s) `);
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
      await fetch(`${API}/api/tasks/${id}/ack`, { method: "POST", headers: hdr }).then(res => j<any>(res));
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
      }).then(res => j<any>(res));
      alert(`Enforce sent: ${action} `);
    } catch (e) {
      alert("Enforce failed: " + (e as Error).message);
    }
  }

  return (
    <div className="min-h-dvh p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-2">
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

      {/* Plan */}
      <section className="grid gap-2 border rounded p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Plan</span>
          <select className="border rounded px-2 py-1" value={plan} onChange={(e)=> setPlan(e.target.value as PlanKey)}>
            <option value="free">Free (1 child)</option>
            <option value="lite">Lite (2 children)</option>
            <option value="elite">Elite (unlimited)</option>
          </select>
          <span className="text-xs text-gray-500">Max children: {maxKids===999 ? "unlimited" : maxKids}</span>
        </div>
      </section>

      {/* Manage Kids */}
      <section className="grid gap-3 border rounded p-4">
        <h2 className="font-medium">Manage Kids</h2>
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Name</span>
            <input className="border rounded px-2 py-1" value={newKidName} onChange={(e)=> setNewKidName(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Device IP</span>
            <input className="border rounded px-2 py-1" placeholder="e.g. 192.168.1.42" value={newKidIP} onChange={(e)=> setNewKidIP(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Phone</span>
            <input className="border rounded px-2 py-1" placeholder="e.g. +1 555 123 4567" value={newKidPhone} onChange={(e)=> setNewKidPhone(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">API Child User</span>
            <select className="border rounded px-2 py-1" value={newKidApiUser} onChange={(e)=> setNewKidApiUser(e.target.value)}>
              <option value="">(none yet)</option>
              {childUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
              {childUsers.length===0 && <option value="u-child">u-child</option>}
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <button className="border rounded px-3 py-1" onClick={addKid}>Add kid</button>
        </div>

        {/* Kid list (editable) */}
        <div className="grid gap-2">
          {kids.length===0 && <div className="text-sm text-gray-500">No kids yet. Add above.</div>}
          {kids.map(k => (
            <div key={k.id} className="border rounded p-3 grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={()=> toggleKid(k.id)} className={cls("px-3 py-1 border rounded", selectedKidIds.includes(k.id) && "bg-black text-white")}>
                  Select
                </button>
                <input className="border rounded px-2 py-1" placeholder="Name" value={k.name} onChange={(e)=> updateKid(k.id, { name: e.target.value })} />
                <input className="border rounded px-2 py-1" placeholder="IP" value={k.ip || ""} onChange={(e)=> updateKid(k.id, { ip: e.target.value })} />
                <input className="border rounded px-2 py-1" placeholder="Phone" value={k.phone || ""} onChange={(e)=> updateKid(k.id, { phone: e.target.value })} />
                <select className="border rounded px-2 py-1" value={k.apiUserId || ""} onChange={(e)=> updateKid(k.id, { apiUserId: e.target.value })}>
                  <option value="">(map to API child)</option>
                  {childUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  {childUsers.length===0 && <option value="u-child">u-child</option>}
                </select>
                <button className="border rounded px-2 py-1" onClick={()=> removeKid(k.id)}>Remove</button>
              </div>
              <div className="text-xs text-gray-500">
                Selected: {selectedKidIds.includes(k.id) ? "Yes" : "No"}  API user: {k.apiUserId || "-"}  IP: {k.ip || "-"}  Phone: {k.phone || "-"}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500">
          Selected: {selectedKidIds.length}/{maxKids===999 ? "" : maxKids}
        </div>
      </section>

      {/* Create Minor Tasks */}
      <section className="grid gap-3 border rounded p-4">
        <h2 className="font-medium">Create Minor Tasks</h2>

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
          <button className="border rounded px-3 py-1" onClick={createMinorTasks} disabled={busy || selectedKidIds.length===0}>Save</button>
          <button className="border rounded px-3 py-1" onClick={resetForm} disabled={busy}>Cancel</button>
        </div>
      </section>

      {/* Parental Enforce (API child users) */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Parental Enforce</h2>
        <div className="grid gap-3">
          {childUsers.length===0 && <div className="text-sm text-gray-500">Add kids above and map them to API Child users.</div>}
          {childUsers.map(u => (
            <div key={u.id} className="border rounded p-3 grid gap-2">
              <div className="font-medium">{u.name} <span className="text-xs text-gray-500">({u.id})</span></div>
              <div className="flex flex-wrap gap-2">
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "play_loud_alert", "Admin")}>Loud alert</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "screen_lock", "Admin")}>Lock screen</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "network_pause", "Admin")}>Pause network</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "device_restart", "Admin")}>Device restart</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "app_restart", "Admin")}>App restart</button>
              </div>
            </div>
          ))}
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

      <footer className="text-xs text-gray-500">Connected to API at {API} as <b>{acting}</b></footer>
    </div>
  );
}
