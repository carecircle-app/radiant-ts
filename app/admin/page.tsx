"use client";
import React, { useEffect, useMemo, useState } from "react";

/* Tiny helpers */
const API = "http://127.0.0.1:4000";
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
function fmtTime(ts?: number) {
  return ts ? new Date(ts).toLocaleTimeString() : "-";
}

/* Types (relaxed) */
type Role = "Owner" | "Family" | "Child" | "Caregiver" | "Relative";
type User = { id: string; name: string; role: Role };
type MinorStage = 0 | 1 | 2 | 3 | 4;
interface Task {
  id: string; title: string; circleId: string;
  assignedTo?: string; due?: number; completed?: boolean; proofKey?: string;
  forMinor?: boolean; ackRequired?: boolean; photoProof?: boolean;
  ackAt?: number; ackBy?: string; __minorStage?: MinorStage;
}
type DeviceKind = "phone" | "pc" | "tablet" | "other";
interface Device {
  id: string;
  circleId: string;
  name: string;
  kind: DeviceKind;
  ownerUserId?: string;
  ip?: string;
  port?: number;
  agentPath?: string;
  agentSecret?: string;
  lastSeenAt?: number;
}

export default function AdminPage() {
  /* Acting user header (defaults to Owner) */
  const [acting, setActing] = useState("u-owner");
  const hdr = useMemo(() => ({ "x-user-id": acting }), [acting]);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const owner = users.find((u) => u.role === "Owner");
  const childUsers = users.filter((u) => u.role === "Child");

  /* Minor task form */
  const [title, setTitle] = useState("Clean desk");
  const [dueMins, setDueMins] = useState(2);
  const [ackRequired, setAckRequired] = useState(true);
  const [photoProof, setPhotoProof] = useState(true);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [childLimit, setChildLimit] = useState<number>(1); // Free=1, Lite=2, Elite=5

  /* Proof upload */
  const [proofTaskId, setProofTaskId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  /* Device form */
  const [devName, setDevName] = useState("Derek-PC");
  const [devKind, setDevKind] = useState<DeviceKind>("pc");
  const [devOwner, setDevOwner] = useState<string>("u-child");
  const [devIP, setDevIP] = useState("192.168.1.50");
  const [devPort, setDevPort] = useState<number>(8088);
  const [devPath, setDevPath] = useState("/control");
  const [devSecret, setDevSecret] = useState("SHARED");

  async function loadAll() {
    setLoading(true);
    try {
      const [u, t, d] = await Promise.all([
        fetch(`${API}/api/users`, { headers: hdr }).then(j<User[]>),
        fetch(`${API}/api/tasks`, { headers: hdr }).then(j<Task[]>),
        fetch(`${API}/api/devices`, { headers: hdr }).then(j<Device[]>).catch(() => [] as Device[]),
      ]);
      setUsers(u); setTasks(t); setDevices(d);
      if (!u.find(x => x.id === devOwner)) {
        const child = u.find(x => x.role === "Child");
        if (child) setDevOwner(child.id);
      }
      if (selectedChildIds.length === 0) {
        const child = u.find(x => x.role === "Child");
        if (child) setSelectedChildIds([child.id]);
      }
    } catch (e: any) {
      alert("Load failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); }, [acting]);

  /* Minor Tasks */
  function toggleChild(id: string) {
    setSelectedChildIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= childLimit) {
        alert(`Limit reached (${childLimit}). Upgrade plan to select more.`);
        return prev;
      }
      return [...prev, id];
    });
  }
  async function createMinorTasks() {
    const due = Date.now() + Math.max(1, dueMins) * 60_000;
    try {
      for (const cid of selectedChildIds) {
        const body = { title, due, assignedTo: cid, forMinor: true, ackRequired, photoProof };
        const r = await fetch(`${API}/api/tasks`, {
          method: "POST",
          headers: { ...hdr, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        await j<any>(r);
      }
      alert(`Created ${selectedChildIds.length} task(s) âœ…`);
      loadAll();
    } catch (e: any) {
      alert("Create failed: " + e.message);
    }
  }
  async function ackTask(id: string) {
    try {
      await j<any>(await fetch(`${API}/api/tasks/${id}/ack`, { method: "POST", headers: hdr }));
      loadAll();
    } catch (e: any) { alert("ACK failed: " + e.message); }
  }

  /* Parental Enforce (signals) */
  async function enforce(targetUserId: string, action: string, reason: string) {
    try {
      await j<any>(await fetch(`${API}/api/parental/enforce`, {
        method: "POST", headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action, reason })
      }));
      alert(`Enforce sent: ${action} âœ…`);
    } catch (e: any) { alert("Enforce failed: " + e.message); }
  }

  /* Proof */
  async function uploadProof() {
    if (!proofTaskId || !proofFile) { alert("Pick a task and a file first"); return; }
    try {
      const presRes = await fetch(`${API}/api/uploads/presign`, {
        method: "POST", headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: proofFile.name, fileType: proofFile.type, fileSize: proofFile.size })
      });
      const pres = await j<{ ok: boolean; url: string; key: string }>(presRes);
      await fetch(pres.url, { method: "PUT", headers: { "Content-Type": proofFile.type || "application/octet-stream" }, body: proofFile });
      await j(await fetch(`${API}/api/uploads/complete`, {
        method: "POST", headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ key: pres.key, size: proofFile.size, mime: proofFile.type || "application/octet-stream" })
      }));
      await j(await fetch(`${API}/api/tasks/${proofTaskId}/proof`, {
        method: "POST", headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ key: pres.key })
      }));
      alert("Proof uploaded & attached âœ…");
      setProofFile(null); setProofTaskId("");
      loadAll();
    } catch (e: any) { alert("Upload failed: " + e.message); }
  }

  /* Devices */
  async function addDevice() {
    try {
      const body = { name: devName, kind: devKind, ip: devIP, port: devPort, agentPath: devPath, agentSecret: devSecret, ownerUserId: devOwner };
      await j(await fetch(`${API}/api/devices`, { method: "POST", headers: { ...hdr, "Content-Type": "application/json" }, body: JSON.stringify(body) }));
      alert("Device saved âœ…");
      loadAll();
    } catch (e: any) { alert("Save failed: " + e.message); }
  }
  async function pingDevice(id: string) {
    try {
      const r = await j<any>(await fetch(`${API}/api/devices/${id}/ping`, { method: "POST", headers: hdr }));
      alert(`Ping: ${r.ok ? "OK" : "Fail"}${r.status ? " ("+r.status+")" : ""}`);
      loadAll();
    } catch (e: any) { alert("Ping failed: " + e.message); }
  }
  async function deviceIntent(id: string, action: string) {
    try {
      await j(await fetch(`${API}/api/devices/${id}/intent`, {
        method: "POST", headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: "Admin page" })
      }));
      alert(`${action} sent âœ…`);
    } catch (e: any) { alert(`${action} failed: ` + e.message); }
  }

  /* UI */
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

      {/* Minor tasks */}
      <section className="grid gap-3 border rounded p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Create Minor Task</h2>
          <div className="flex items-center gap-2 text-sm">
            <span>Max children</span>
            <select className="border rounded px-1 py-0.5" value={childLimit} onChange={e=> setChildLimit(Number(e.target.value))}>
              <option value={1}>Free (1)</option>
              <option value={2}>Lite (2)</option>
              <option value={5}>Elite (5)</option>
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Select up to {childLimit} children</span>
            <div className="border rounded p-2 max-h-40 overflow-auto space-y-1">
              {childUsers.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedChildIds.includes(c.id)} onChange={()=> toggleChild(c.id)} />
                  <span>{c.name} ({c.role})</span>
                </label>
              ))}
              {childUsers.length===0 && <div className="text-gray-500 text-sm">No Child users found.</div>}
            </div>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Title</span>
            <input className="border rounded px-2 py-1" value={title} onChange={e=> setTitle(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Due (minutes from now)</span>
            <input type="number" className="border rounded px-2 py-1" value={dueMins} onChange={e=> setDueMins(Number(e.target.value||"0"))} />
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ackRequired} onChange={e=> setAckRequired(e.target.checked)} /> Ack required</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={photoProof} onChange={e=> setPhotoProof(e.target.checked)} /> Photo proof</label>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="border rounded px-3 py-1" onClick={createMinorTasks} disabled={loading || selectedChildIds.length===0}>
            Create {selectedChildIds.length} task{selectedChildIds.length===1 ? "" : "s"}
          </button>
        </div>
      </section>

      {/* Parental Enforce */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Parental Enforce</h2>
        <div className="flex flex-wrap gap-3">
          {childUsers.map(u => (
            <div key={u.id} className="border rounded p-3 grid gap-2">
              <div className="font-medium">{u.name}</div>
              <div className="flex gap-2 flex-wrap">
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "play_loud_alert", "Admin page")}>Loud alert</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "screen_lock", "Admin page")}>Lock screen</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "network_pause", "Admin page")}>Pause network</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "device_restart", "Admin page")}>Restart device (signal)</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "app_restart", "Admin page")}>Restart app (signal)</button>
              </div>
            </div>
          ))}
          {childUsers.length===0 && <div className="text-sm text-gray-500">No Child users.</div>}
        </div>
      </section>

      {/* Device Registry */}
      <section className="grid gap-3 border rounded p-4">
        <h2 className="font-medium">Device Registry (IP)</h2>
        <div className="grid md:grid-cols-6 gap-3 items-end">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Name</span>
            <input className="border rounded px-2 py-1" value={devName} onChange={e=> setDevName(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Owner</span>
            <select className="border rounded px-2 py-1" value={devOwner} onChange={e=> setDevOwner(e.target.value)}>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              {users.length===0 && <option value="u-child">Derek (Child)</option>}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Kind</span>
            <select className="border rounded px-2 py-1" value={devKind} onChange={e=> setDevKind(e.target.value as DeviceKind)}>
              <option value="pc">PC</option>
              <option value="phone">Phone</option>
              <option value="tablet">Tablet</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">IP</span>
            <input className="border rounded px-2 py-1" value={devIP} onChange={e=> setDevIP(e.target.value)} placeholder="192.168.1.50" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Port</span>
            <input type="number" className="border rounded px-2 py-1" value={devPort} onChange={e=> setDevPort(Number(e.target.value||"0"))} />
          </label>
          <div className="grid gap-1">
            <span className="text-sm text-gray-600">Agent Secret</span>
            <input className="border rounded px-2 py-1" value={devSecret} onChange={e=> setDevSecret(e.target.value)} />
          </div>
          <label className="md:col-span-6 grid gap-1">
            <span className="text-sm text-gray-600">Agent Path</span>
            <input className="border rounded px-2 py-1" value={devPath} onChange={e=> setDevPath(e.target.value)} />
          </label>
        </div>
        <div className="flex gap-2">
          <button className="border rounded px-3 py-1" onClick={addDevice}>Save device</button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm mt-3">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2 pr-4">IP</th>
                <th className="py-2 pr-4">Port</th>
                <th className="py-2 pr-4">Last Seen</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(d => (
                <tr key={d.id} className="border-b">
                  <td className="py-2 pr-4">{d.name} ({d.kind})</td>
                  <td className="py-2 pr-4">{d.ownerUserId || "-"}</td>
                  <td className="py-2 pr-4">{d.ip || "-"}</td>
                  <td className="py-2 pr-4">{d.port ?? "-"}</td>
                  <td className="py-2 pr-4">{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleTimeString() : "-"}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <button className="border rounded px-2 py-1" onClick={()=> pingDevice(d.id)}>Ping</button>
                      <button className="border rounded px-2 py-1" onClick={()=> deviceIntent(d.id, "device_restart")}>Restart device</button>
                      <button className="border rounded px-2 py-1" onClick={()=> deviceIntent(d.id, "device_shutdown")}>Shutdown device</button>
                      <button className="border rounded px-2 py-1" onClick={()=> deviceIntent(d.id, "app_restart")}>Restart app</button>
                    </div>
                  </td>
                </tr>
              ))}
              {devices.length===0 && <tr><td className="py-4 text-gray-500" colSpan={6}>No devices</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upload photo proof */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Upload Photo Proof</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select className="border rounded px-2 py-1" value={proofTaskId} onChange={(e)=> setProofTaskId(e.target.value)}>
            <option value="">Select taskâ€¦</option>
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
              {tasks.map(t => (
                <tr key={t.id} className="border-b">
                  <td className="py-2 pr-4">{t.title}</td>
                  <td className="py-2 pr-4">{t.assignedTo || "-"}</td>
                  <td className="py-2 pr-4">{fmtTime(t.due)}</td>
                  <td className="py-2 pr-4">{t.forMinor ? `stage ${t.__minorStage ?? 0}` : "-"}</td>
                  <td className="py-2 pr-4">{t.ackBy || "-"}</td>
                  <td className="py-2 pr-4">{t.proofKey ? t.proofKey.split("/").slice(-1)[0] : "-"}</td>
                  <td className="py-2"><button className="border rounded px-2 py-1" onClick={()=> ackTask(t.id)}>Ack</button></td>
                </tr>
              ))}
              {tasks.length===0 && <tr><td className="py-4 text-gray-500" colSpan={7}>No tasks</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="text-xs text-gray-500">Connected to API at {API} as <b>{acting}</b></footer>
    </div>
  );
}
