"use client";
import React, { useEffect, useMemo, useState } from "react";

// ---- tiny helpers ----
const API = "http://127.0.0.1:4000"; // backend API base
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
function cls(...a: Array<string | false | undefined>) {
  return a.filter(Boolean).join(" ");
}

// ---- types (relaxed) ----
type User = { id: string; name: string; role: string };
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

export default function AdminPage() {
  // acting user header (defaults to owner)
  const [acting, setActing] = useState<string>("u-owner");
  const hdr = useMemo(() => ({ "x-user-id": acting }), [acting]);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const owner = users.find((u) => u.role === "Owner");
  const childUsers = users.filter((u) => u.role === "Child");

  // form state
  const [title, setTitle] = useState("Clean desk");
  const [assignee, setAssignee] = useState<string>("u-child");
  const [dueMins, setDueMins] = useState<number>(2);
  const [ackRequired, setAckRequired] = useState(true);
  const [photoProof, setPhotoProof] = useState(true);

  const [proofTaskId, setProofTaskId] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([
        fetch(`${API}/api/users`, { headers: hdr }).then(j<User[]>),
        fetch(`${API}/api/tasks`, { headers: hdr }).then(j<Task[]>),
      ]);
      setUsers(u);
      setTasks(t);
      if (!u.find((x) => x.id === assignee)) {
        const child = u.find((x) => x.role === "Child");
        if (child) setAssignee(child.id);
      }
    } catch (err) {
      console.error(err);
      alert("Load failed: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, [acting]);

  // ---- actions ----
  async function createMinorTask() {
    const due = Date.now() + Math.max(1, dueMins) * 60_000;
    try {
      const body = {
        title,
        due,
        assignedTo: assignee,
        forMinor: true,
        ackRequired,
        photoProof,
      };
      await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(j);
      alert("Task created ");
      await loadAll();
    } catch (e) {
      alert("Create failed: " + (e as Error).message);
    }
  }

  async function ackTask(id: string) {
    try {
      await fetch(`${API}/api/tasks/${id}/ack`, { method: "POST", headers: hdr }).then(j);
      alert("ACK sent ");
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

  async function uploadProof() {
    if (!proofTaskId || !proofFile) { alert("Pick a task and a file first"); return; }
    try {
      // 1) presign
      const pres = await fetch(`${API}/api/uploads/presign`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: proofFile.name, fileType: proofFile.type, fileSize: proofFile.size }),
      }).then(j<{ ok: boolean; url: string; key: string }>);
      // 2) raw PUT
      await fetch(pres.url, { method: "PUT", headers: { "Content-Type": proofFile.type || "application/octet-stream" }, body: proofFile });
      // 3) complete
      await fetch(`${API}/api/uploads/complete`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ key: pres.key, size: proofFile.size, mime: proofFile.type || "application/octet-stream" }),
      }).then(j);
      // 4) attach to task
      await fetch(`${API}/api/tasks/${proofTaskId}/proof`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ key: pres.key }),
      }).then(j);
      alert("Proof uploaded & attached ");
      setProofFile(null);
      setProofTaskId("");
      await loadAll();
    } catch (e) {
      alert("Upload failed: " + (e as Error).message);
    }
  }

  return (
    <div className="min-h-dvh p-6 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Acting user</span>
          <select
            className="border rounded px-2 py-1"
            value={acting}
            onChange={(e) => setActing(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
            {users.length === 0 && (
              <>
                <option value="u-owner">Owner (Owner)</option>
                <option value="u-child">Derek (Child)</option>
                <option value="u-fam">Ryan (Family)</option>
              </>
            )}
          </select>
          <button className="ml-2 border rounded px-3 py-1" disabled={loading} onClick={loadAll}>Refresh</button>
        </div>
      </header>

      {/* Create Minor Task */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Create Minor Task</h2>
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Title</span>
            <input className="border rounded px-2 py-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Assignee</span>
            <select className="border rounded px-2 py-1" value={assignee} onChange={(e)=> setAssignee(e.target.value)}>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              {users.length===0 && <option value="u-child">Derek (Child)</option>}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Due (minutes from now)</span>
            <input type="number" className="border rounded px-2 py-1" value={dueMins} onChange={(e)=> setDueMins(Number(e.target.value||"0"))} />
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ackRequired} onChange={(e)=> setAckRequired(e.target.checked)} /> Ack required</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={photoProof} onChange={(e)=> setPhotoProof(e.target.checked)} /> Photo proof</label>
          </div>
        </div>
        <div>
          <button className="border rounded px-3 py-1" onClick={createMinorTask} disabled={loading}>Create</button>
        </div>
      </section>

      {/* Parental Enforce */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Parental Enforce</h2>
        {childUsers.length === 0 && <div className="text-sm text-gray-500">No Child users found.</div>}
        <div className="flex flex-wrap gap-3">
          {childUsers.map((u) => (
            <div key={u.id} className="border rounded p-3 grid gap-2">
              <div className="font-medium">{u.name}</div>
              <div className="flex gap-2">
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "play_loud_alert", "Admin page")}>Loud alert</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "screen_lock", "Admin page")}>Lock screen</button>
                <button className="border rounded px-2 py-1" onClick={()=> enforce(u.id, "network_pause", "Admin page")}>Pause network</button>
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
                  <td className="py-2 pr-4">{t.due ? new Date(t.due).toLocaleTimeString() : "-"}</td>
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

      <footer className="text-xs text-gray-500">
        Connected to API at {API} as <b>{acting}</b>
      </footer>
    </div>
  );
}
