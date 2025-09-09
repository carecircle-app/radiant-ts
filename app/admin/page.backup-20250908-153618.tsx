"use client";
import React, { useEffect, useMemo, useState } from "react";

/* ---------- tiny helpers ---------- */
const API = "http://127.0.0.1:4000";
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
function cls(...a: Array<string | false | undefined>) {
  return a.filter(Boolean).join(" ");
}
type Plan = "free" | "lite" | "elite";
const PLAN_CAP: Record<Plan, number> = { free: 1, lite: 2, elite: 5 };

/* ---------- types ---------- */
type User = { id: string; name: string; role: string; phone?: string; devices?: Device[] };
type Device = { id: string; userId: string; name: string; ip?: string; type?: string };
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
  repeat?: "none"|"daily"|"weekly";
  repeatDays?: number[];
  repeatTime?: string;
}

/* ---------- component ---------- */
export default function AdminPage() {
  const [acting, setActing] = useState("u-owner");
  const hdr = useMemo(() => ({ "x-user-id": acting }), [acting]);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<Plan>("free");
  const planCap = PLAN_CAP[plan];

  // Add Child form
  const [childName, setChildName] = useState("");
  const [childPhone, setChildPhone] = useState("");
  const [childPCIp, setChildPCIp] = useState("");
  const [childPhoneIp, setChildPhoneIp] = useState("");

  // Weekly schedule form
  const [title, setTitle] = useState("Clean room");
  const [weekDays, setWeekDays] = useState<number[]>([1]); // Monday
  const [timeHm, setTimeHm] = useState("08:00");
  const [ackRequired, setAckRequired] = useState(true);
  const [photoProof, setPhotoProof] = useState(true);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  const [formDirty, setFormDirty] = useState(false);

  // Upload proof
  const [proofTaskId, setProofTaskId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const owner = users.find(u => u.role === "Owner");
  const childUsers = users.filter(u => u.role === "Child");

  async function loadAll() {
    setLoading(true);
    try {
      const [u, t, p] = await Promise.all([
        fetch(`${API}/api/users`, { headers: hdr }).then(j<User[]>),
        fetch(`${API}/api/tasks`, { headers: hdr }).then(j<Task[]>),
        fetch(`${API}/api/billing/plan`, { headers: hdr }).then(j<{plan:Plan}>),
      ]);
      setUsers(u);
      setTasks(t);
      setPlan(p.plan);
      // trim selection to plan cap
      setSelectedKids(prev => prev.filter(id => u.some(x=>x.id===id)).slice(0, PLAN_CAP[p.plan]));
    } catch (err) {
      alert("Load failed: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); }, [acting]);

  /* ---------- actions ---------- */
  async function setPlanApi(next: Plan) {
    try {
      await fetch(`${API}/api/billing/plan`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ plan: next }),
      }).then(j);
      setPlan(next);
      setSelectedKids(prev => prev.slice(0, PLAN_CAP[next]));
      alert(`Plan set to ${next.toUpperCase()}`);
    } catch (e) { alert("Plan update failed: " + (e as Error).message); }
  }

  async function addChild() {
    if (!childName.trim()) { alert("Enter child name"); return; }
    try {
      const devices = [
        childPCIp ? { name: "PC", ip: childPCIp, type: "pc" } : null,
        childPhoneIp ? { name: "Phone", ip: childPhoneIp, type: "phone" } : null
      ].filter(Boolean);
      await fetch(`${API}/api/admin/add-child`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ name: childName, phone: childPhone, devices }),
      }).then(j<User>);
      setChildName(""); setChildPhone(""); setChildPCIp(""); setChildPhoneIp("");
      await loadAll();
      alert("Child added ");
    } catch (e) { alert("Add child failed: " + (e as Error).message); }
  }

  function toggleKid(id: string) {
    setFormDirty(true);
    setSelectedKids(prev => {
      const has = prev.includes(id);
      if (has) return prev.filter(x => x !== id);
      if (prev.length >= planCap) { alert(`Plan '${plan}' allows up to ${planCap} child(ren)`); return prev; }
      return [...prev, id];
    });
  }

  async function saveWeeklySchedule() {
    if (!title.trim()) { alert("Enter a title"); return; }
    if (selectedKids.length === 0) { alert("Select at least one child"); return; }
    try {
      await fetch(`${API}/api/admin/schedule`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          childIds: selectedKids,
          weeklyDays: weekDays,
          timeHm,
          ackRequired,
          photoProof
        }),
      }).then(j);
      setFormDirty(false);
      alert("Schedule saved ");
      await loadAll();
    } catch (e) { alert("Save failed: " + (e as Error).message); }
  }
  function cancelWeeklyForm() {
    setTitle("Clean room");
    setWeekDays([1]);
    setTimeHm("08:00");
    setAckRequired(true);
    setPhotoProof(true);
    setSelectedKids([]);
    setFormDirty(false);
  }

  async function ackTask(id: string) {
    try {
      await fetch(`${API}/api/tasks/${id}/ack`, { method: "POST", headers: hdr }).then(j);
      await loadAll();
    } catch (e) { alert("ACK failed: " + (e as Error).message); }
  }

  async function enforce(targetUserId: string, action: string, reason: string) {
    try {
      await fetch(`${API}/api/parental/enforce`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action, reason }),
      }).then(j);
      alert(`Enforce: ${action} `);
    } catch (e) { alert("Enforce failed: " + (e as Error).message); }
  }

  async function uploadProof() {
    if (!proofTaskId || !proofFile) { alert("Pick a task and a file first"); return; }
    try {
      const pres = await fetch(`${API}/api/uploads/presign`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: proofFile.name, fileType: proofFile.type, fileSize: proofFile.size }),
      }).then(j<{ ok: boolean; url: string; key: string }>);
      await fetch(pres.url, { method: "PUT", headers: { "Content-Type": proofFile.type || "application/octet-stream" }, body: proofFile });
      await fetch(`${API}/api/uploads/complete`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ key: pres.key, size: proofFile.size, mime: proofFile.type || "application/octet-stream" }),
      }).then(j);
      await fetch(`${API}/api/tasks/${proofTaskId}/proof`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ key: pres.key }),
      }).then(j);
      setProofFile(null); setProofTaskId("");
      await loadAll();
      alert("Proof uploaded ");
    } catch (e) { alert("Upload failed: " + (e as Error).message); }
  }

  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <div className="min-h-dvh p-6 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Acting user</span>
          <select className="border rounded px-2 py-1" value={acting} onChange={(e)=> setActing(e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            {users.length===0 && <>
              <option value="u-owner">Owner (Owner)</option>
              <option value="u-child">Derek (Child)</option>
              <option value="u-fam">Ryan (Family)</option>
            </>}
          </select>
          <button className="ml-2 border rounded px-3 py-1" disabled={loading} onClick={loadAll}>Refresh</button>
        </div>
      </header>

      {/* Plan */}
      <section className="grid gap-2 border rounded p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Plan</h2>
          <div className="text-sm">Current: <b>{plan.toUpperCase()}</b>  child cap: {planCap}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["free","lite","elite"] as Plan[]).map(p => (
            <button key={p} className={cls("border rounded px-3 py-1", plan===p && "bg-gray-100")}
              onClick={()=> setPlanApi(p)} disabled={plan===p}>{p.toUpperCase()}</button>
          ))}
        </div>
      </section>

      {/* Add Child */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Add Child</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Name</span>
            <input className="border rounded px-2 py-1" value={childName} onChange={(e)=> setChildName(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Phone (optional)</span>
            <input className="border rounded px-2 py-1" value={childPhone} onChange={(e)=> setChildPhone(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">PC IP (optional)</span>
            <input className="border rounded px-2 py-1" value={childPCIp} onChange={(e)=> setChildPCIp(e.target.value)} placeholder="e.g. 192.168.1.25" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Phone IP (optional)</span>
            <input className="border rounded px-2 py-1" value={childPhoneIp} onChange={(e)=> setChildPhoneIp(e.target.value)} placeholder="e.g. 192.168.1.31" />
          </label>
        </div>
        <div>
          <button className="border rounded px-3 py-1" onClick={addChild}>Add Child</button>
        </div>
      </section>

      {/* Weekly Scheduled Tasks (Save / Cancel) */}
      <section className="grid gap-2 border rounded p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Weekly Scheduled Tasks</h2>
          <div className="text-xs text-gray-500">Select up to {planCap} children</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Title</span>
              <input className="border rounded px-2 py-1" value={title} onChange={(e)=> { setTitle(e.target.value); setFormDirty(true); }} />
            </label>
            <div className="grid gap-1">
              <span className="text-sm text-gray-600">Days of week</span>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d, idx)=> (
                  <label key={idx} className="flex items-center gap-1 border rounded px-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={weekDays.includes(idx)} onChange={(e)=> {
                      setFormDirty(true);
                      setWeekDays(prev => e.target.checked ? [...prev, idx] : prev.filter(x=>x!==idx));
                    }}/>
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Time (HH:mm)</span>
              <input className="border rounded px-2 py-1" type="time" value={timeHm} onChange={(e)=> { setTimeHm(e.target.value); setFormDirty(true); }} />
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={ackRequired} onChange={(e)=> { setAckRequired(e.target.checked); setFormDirty(true); }} />
                Ack required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={photoProof} onChange={(e)=> { setPhotoProof(e.target.checked); setFormDirty(true); }} />
                Photo proof
              </label>
            </div>
          </div>

          {/* kid selection */}
          <div className="grid gap-2">
            <span className="text-sm text-gray-600">Children</span>
            <div className="flex flex-wrap gap-2">
              {childUsers.map(u => {
                const on = selectedKids.includes(u.id);
                return (
                  <button key={u.id}
                    className={cls("border rounded px-3 py-1", on && "bg-gray-100")}
                    onClick={()=> toggleKid(u.id)}>
                    {u.name}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-gray-500">Selected: {selectedKids.length}/{planCap}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="border rounded px-3 py-1" onClick={saveWeeklySchedule} disabled={!formDirty}>Save</button>
          <button className="border rounded px-3 py-1" onClick={cancelWeeklyForm} disabled={!formDirty}>Cancel</button>
        </div>
      </section>

      {/* Parental enforce + device controls */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Parental Enforce</h2>
        <div className="flex flex-wrap gap-3">
          {childUsers.map(u => (
            <div key={u.id} className="border rounded p-3 grid gap-2 min-w-[240px]">
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-gray-500">Devices: {(u.devices||[]).map(d=>d.ip||d.name).join(", ") || ""}</div>
              <div className="flex flex-wrap gap-2">
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "play_loud_alert", "Admin page")}>Loud alert</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "screen_lock", "Admin page")}>Lock</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "network_pause", "Admin page")}>Pause net</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "app_restart", "Admin page")}>App restart</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "device_restart", "Admin page")}>Device restart</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "device_shutdown", "Admin page")}>Shutdown</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upload photo proof */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Upload Photo Proof</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select className="border rounded px-2 py-1" value={proofTaskId} onChange={(e)=> setProofTaskId(e.target.value)}>
            <option value="">Select task</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <input type="file" onChange={(e)=> setProofFile(e.currentTarget.files?.[0] ?? null)} />
          <button className="border rounded px-3 py-1" onClick={uploadProof} disabled={!proofTaskId || !proofFile}>Upload proof</button>
        </div>
      </section>

      {/* Tasks table */}
      <section className="grid gap-2 border rounded p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Tasks</h2>
          <button className="border rounded px-3 py-1" onClick={loadAll} disabled={loading}>Refresh</button>
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
                  <td className="py-2 pr-4">{t.ackBy ? `${t.ackBy}` : "-"}</td>
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
