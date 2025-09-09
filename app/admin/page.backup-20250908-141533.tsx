/* eslint-disable */
 // @ts-nocheck
"use client";
import React, { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:4000";
async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
function cx(...a) { return a.filter(Boolean).join(" "); }

const DOW = [
  { key: 0, label: "Sun" },
  { key: 1, label: "Mon" },
  { key: 2, label: "Tue" },
  { key: 3, label: "Wed" },
  { key: 4, label: "Thu" },
  { key: 5, label: "Fri" },
  { key: 6, label: "Sat" },
];

function nextTsForWeekdayAndTime(dow, HHmm) {
  const [HH, mm] = HHmm.split(":").map(x => Number(x) || 0);
  const now = new Date();
  const tgt = new Date();
  tgt.setHours(HH, mm, 0, 0);
  const deltaDays = (dow - now.getDay() + 7) % 7;
  if (deltaDays === 0 && tgt <= now) tgt.setDate(tgt.getDate() + 7);
  else tgt.setDate(tgt.getDate() + deltaDays);
  return tgt.getTime();
}

export default function AdminPage() {
  // Acting user
  const [acting, setActing] = useState("u-owner");
  const hdr = useMemo(() => ({ "x-user-id": acting }), [acting]);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const childUsers = users.filter(u => u.role === "Child");

  // Plan UI cap (Free=1, Lite=2, Elite=5)
  const [plan, setPlan] = useState("Elite");
  const planCap = plan === "Free" ? 1 : plan === "Lite" ? 2 : 5;

  // Add child
  const [newChildName, setNewChildName] = useState("");

  // Create task mode
  const [mode, setMode] = useState("now"); // "now" | "weekly"

  // Common fields
  const [title, setTitle] = useState("Clean desk");
  const [ackRequired, setAckRequired] = useState(true);
  const [photoProof, setPhotoProof] = useState(true);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const selectedCount = selectedChildIds.length;

  // Now-mode
  const [dueMins, setDueMins] = useState(2);

  // Weekly-mode
  const [weeklyTime, setWeeklyTime] = useState("08:00");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1]); // Monday default

  // Presets
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<any[]>([]);

  // Proof
  const [proofTaskId, setProofTaskId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([
        fetchJson(`${API}/api/users`, { headers: hdr }),
        fetchJson(`${API}/api/tasks`, { headers: hdr }),
      ]);
      setUsers(u);
      setTasks(t);

      if (selectedChildIds.length === 0) {
        const first = u.find(x => x.role === "Child");
        if (first) setSelectedChildIds([first.id]);
      } else {
        setSelectedChildIds(prev => prev.filter(id => !!u.find(x => x.id === id)));
      }

      const raw = localStorage.getItem("admin_presets");
      setPresets(raw ? JSON.parse(raw) : []);
    } catch (e) {
      alert("Load failed: " + e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadAll(); }, [acting]);

  function toggleChild(id) {
    setSelectedChildIds(prev => {
      const has = prev.includes(id);
      if (has) return prev.filter(x => x !== id);
      if (prev.length >= planCap) return prev;
      return [...prev, id];
    });
  }

  function resetForm() {
    setTitle("Clean desk");
    setAckRequired(true);
    setPhotoProof(true);
    setDueMins(2);
    setWeeklyTime("08:00");
    setWeeklyDays([1]);
    // keep selected children as-is
  }

  async function addChild() {
    const name = newChildName.trim();
    if (!name) { alert("Enter a name"); return; }
    try {
      await fetchJson(`${API}/api/users`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ name, role: "Child", language: "en" }),
      });
      setNewChildName("");
      await loadAll();
    } catch (e) {
      alert("Add child failed: " + e.message);
    }
  }

  async function createTasks() {
    if (!title.trim()) { alert("Title required"); return; }
    if (selectedChildIds.length === 0) { alert("Pick at least one child"); return; }

    try {
      if (mode === "now") {
        const due = Date.now() + Math.max(1, Number(dueMins) || 1) * 60_000;
        const base = { title, due, forMinor: true, ackRequired, photoProof, repeat: "none" };
        for (const uid of selectedChildIds) {
          await fetchJson(`${API}/api/tasks`, {
            method: "POST",
            headers: { ...hdr, "Content-Type": "application/json" },
            body: JSON.stringify({ ...base, assignedTo: uid }),
          });
        }
        alert(`Created ${selectedChildIds.length} immediate task(s) `);
      } else {
        // weekly: create repeating tasks (due = next occurrence of selected days/time)
        const base = { title, forMinor: true, ackRequired, photoProof, repeat: "weekly" };
        for (const uid of selectedChildIds) {
          for (const d of weeklyDays) {
            const due = nextTsForWeekdayAndTime(d, weeklyTime);
            await fetchJson(`${API}/api/tasks`, {
              method: "POST",
              headers: { ...hdr, "Content-Type": "application/json" },
              body: JSON.stringify({ ...base, assignedTo: uid, due }),
            });
          }
        }
        alert(`Created ${selectedChildIds.length * weeklyDays.length} weekly task(s) `);
      }
      await loadAll();
    } catch (e) {
      alert("Create failed: " + e.message);
    }
  }

  async function completeTask(id) {
    try {
      await fetchJson(`${API}/api/tasks/${id}/complete`, { method: "POST", headers: hdr });
      await loadAll();
    } catch (e) {
      alert("Complete failed: " + e.message);
    }
  }

  async function ackTask(id) {
    try {
      await fetchJson(`${API}/api/tasks/${id}/ack`, { method: "POST", headers: hdr });
      await loadAll();
    } catch (e) {
      alert("ACK failed: " + e.message);
    }
  }

  async function uploadProof() {
    if (!proofTaskId || !proofFile) { alert("Pick a task and a file first"); return; }
    try {
      const pres = await fetchJson(`${API}/api/uploads/presign`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: proofFile.name,
          fileType: proofFile.type || "application/octet-stream",
          fileSize: proofFile.size
        }),
      });
      await fetch(pres.url, { method: "PUT", headers: { "Content-Type": proofFile.type || "application/octet-stream" }, body: proofFile });
      await fetchJson(`${API}/api/uploads/complete`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ key: pres.key, size: proofFile.size, mime: proofFile.type || "application/octet-stream" }),
      });
      await fetchJson(`${API}/api/tasks/${proofTaskId}/proof`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ key: pres.key }),
      });
      alert("Proof uploaded & attached ");
      setProofFile(null);
      setProofTaskId("");
      await loadAll();
    } catch (e) {
      alert("Upload failed: " + e.message);
    }
  }

  async function enforce(targetUserId, action, reason) {
    try {
      await fetchJson(`${API}/api/parental/enforce`, {
        method: "POST",
        headers: { ...hdr, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action, reason }),
      });
      alert(`Enforce sent: ${action} `);
    } catch (e) {
      alert("Enforce failed: " + e.message);
    }
  }

  // Presets in localStorage
  function savePreset() {
    const name = presetName.trim();
    if (!name) { alert("Give this preset a name"); return; }
    const payload = {
      name,
      data: {
        plan, mode, title,
        ackRequired, photoProof,
        dueMins,
        weeklyTime,
        weeklyDays,
        selectedChildIds,
      }
    };
    const arr = [...presets.filter(p => p.name !== name), payload];
    localStorage.setItem("admin_presets", JSON.stringify(arr));
    setPresets(arr);
    alert("Preset saved ");
  }
  function applyPresetByName(name) {
    const p = presets.find(x => x.name === name);
    if (!p) return;
    const d = p.data || {};
    setPlan(d.plan ?? "Elite");
    setMode(d.mode ?? "now");
    setTitle(d.title ?? "Clean desk");
    setAckRequired(!!d.ackRequired);
    setPhotoProof(!!d.photoProof);
    setDueMins(Number(d.dueMins ?? 2));
    setWeeklyTime(d.weeklyTime ?? "08:00");
    setWeeklyDays(Array.isArray(d.weeklyDays) ? d.weeklyDays : [1]);
    setSelectedChildIds(Array.isArray(d.selectedChildIds) ? d.selectedChildIds.slice(0, planCap) : []);
  }
  function deletePreset(name) {
    const arr = presets.filter(p => p.name !== name);
    localStorage.setItem("admin_presets", JSON.stringify(arr));
    setPresets(arr);
  }

  return (
    <div className="min-h-dvh p-6 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Acting</span>
          <select className="border rounded px-2 py-1" value={acting} onChange={e => setActing(e.target.value)}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            {users.length === 0 && <option value="u-owner">Owner (Owner)</option>}
          </select>
          <button className="ml-2 border rounded px-3 py-1" disabled={loading} onClick={loadAll}>Refresh</button>
        </div>
      </header>

      {/* Plan + Add Child */}
      <section className="grid gap-2 border rounded p-4">
        <div className="flex flex-wrap gap-6 items-end">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Plan (UI cap)</span>
            <select className="border rounded px-2 py-1" value={plan} onChange={e => setPlan(e.target.value)}>
              <option>Free</option>
              <option>Lite</option>
              <option>Elite</option>
            </select>
            <span className="text-xs text-gray-500">Cap: {planCap} child{planCap>1?"ren":""} max</span>
          </label>

          <div className="grow" />

          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Add child (name)</span>
            <div className="flex gap-2">
              <input className="border rounded px-2 py-1" value={newChildName} onChange={e => setNewChildName(e.target.value)} placeholder="e.g., Alex" />
              <button className="border rounded px-3 py-1" onClick={addChild}>Add</button>
            </div>
          </label>
        </div>
      </section>

      {/* Create Task */}
      <section className="grid gap-2 border rounded p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Create Minor Task</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="mode" value="now" checked={mode==="now"} onChange={() => setMode("now")} /> Now
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="mode" value="weekly" checked={mode==="weekly"} onChange={() => setMode("weekly")} /> Weekly schedule
            </label>
          </div>
        </div>

        <div className="text-sm text-gray-600">Select up to {planCap} children</div>
        <div className="flex flex-wrap gap-3">
          {childUsers.map(u => {
            const checked = selectedChildIds.includes(u.id);
            const disabled = !checked && selectedCount >= planCap;
            return (
              <label key={u.id} className={cx("flex items-center gap-2", disabled && "opacity-50")}>
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleChild(u.id)} />
                {u.name}
              </label>
            );
          })}
          {childUsers.length === 0 && <div className="text-sm text-gray-500">No Child users found.</div>}
        </div>
        <div className="text-xs text-gray-500">Selected: {selectedCount}/{planCap}</div>

        <div className="grid md:grid-cols-4 gap-3 items-end mt-2">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Title</span>
            <input className="border rounded px-2 py-1" value={title} onChange={e => setTitle(e.target.value)} />
          </label>

          {mode === "now" ? (
            <label className="grid gap-1">
              <span className="text-sm text-gray-600">Due (minutes from now)</span>
              <input type="number" className="border rounded px-2 py-1" value={dueMins} onChange={e => setDueMins(Number(e.target.value || "0"))} />
            </label>
          ) : (
            <div className="grid gap-1">
              <span className="text-sm text-gray-600">Weekly time (local)</span>
              <input type="time" className="border rounded px-2 py-1" value={weeklyTime} onChange={e => setWeeklyTime(e.target.value)} />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ackRequired} onChange={e => setAckRequired(e.target.checked)} /> Ack required</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={photoProof} onChange={e => setPhotoProof(e.target.checked)} /> Photo proof</label>
          </div>

          <div className="flex gap-2">
            <button className="border rounded px-3 py-1" onClick={createTasks} disabled={loading || selectedCount === 0}>
              Create {Math.max(1, selectedCount)} {mode==="now"?"task":"weekly"}
            </button>
            <button className="border rounded px-3 py-1" onClick={resetForm}>Cancel</button>
            <button className="border rounded px-3 py-1" onClick={() => {
              const name = prompt("Save preset as (name)?", presetName || "Weekday chores");
              if (!name) return;
              setPresetName(name);
              setTimeout(() => savePreset(), 0);
            }}>Save preset</button>
          </div>
        </div>

        {mode === "weekly" && (
          <div className="flex flex-wrap gap-3 mt-2">
            {DOW.map(d => (
              <label key={d.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={weeklyDays.includes(d.key)}
                  onChange={() => {
                    setWeeklyDays(prev => prev.includes(d.key) ? prev.filter(x=>x!==d.key) : [...prev, d.key]);
                  }}
                />
                {d.label}
              </label>
            ))}
            <div className="text-xs text-gray-500">Pick one or more days</div>
          </div>
        )}

        {/* Presets row */}
        <div className="flex flex-wrap items-end gap-3 mt-2">
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Preset name</span>
            <input className="border rounded px-2 py-1" value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="e.g., Weekday chores" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-600">Load preset</span>
            <select className="border rounded px-2 py-1" onChange={(e) => { if (e.target.value) applyPresetByName(e.target.value); }}>
              <option value=""> Select </option>
              {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </label>
          {presets.length > 0 && (
            <button className="border rounded px-3 py-1" onClick={() => {
              const name = prompt("Delete which preset? Type its exact name:");
              if (!name) return;
              deletePreset(name);
            }}>
              Delete preset
            </button>
          )}
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
                <button className="border rounded px-2 py-1" onClick={() => enforce(u.id, "play_loud_alert", "Admin page")}>Loud alert</button>
                <button className="border rounded px-2 py-1" onClick={() => enforce(u.id, "screen_lock", "Admin page")}>Lock screen</button>
                <button className="border rounded px-2 py-1" onClick={() => enforce(u.id, "network_pause", "Admin page")}>Pause network</button>
                <button className="border rounded px-2 py-1" onClick={() => enforce(u.id, "app_restart", "Admin page")}>Restart app</button>
                <button className="border rounded px-2 py-1" onClick={() => enforce(u.id, "device_restart", "Admin page")}>Restart device</button>
              </div>
              <div className="text-xs text-gray-500">Clients should interpret these signals and perform the local action.</div>
            </div>
          ))}
          {childUsers.length === 0 && <div className="text-sm text-gray-500">No Child users found.</div>}
        </div>
      </section>

      {/* Upload photo proof */}
      <section className="grid gap-2 border rounded p-4">
        <h2 className="font-medium">Upload Photo Proof</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select className="border rounded px-2 py-1" value={proofTaskId} onChange={e => setProofTaskId(e.target.value)}>
            <option value="">Select task</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <input type="file" onChange={e => setProofFile(e.currentTarget.files?.[0] ?? null)} />
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
                  <td className="py-2 pr-4">{t.due ? new Date(t.due).toLocaleString() : "-"}</td>
                  <td className="py-2 pr-4">{t.forMinor ? `stage ${t.__minorStage ?? 0}` : "-"}</td>
                  <td className="py-2 pr-4">{t.ackBy ? `${t.ackBy}` : "-"}</td>
                  <td className="py-2 pr-4">{t.proofKey ? t.proofKey.split("/").slice(-1)[0] : "-"}</td>
                  <td className="py-2 flex gap-2">
                    <button className="border rounded px-2 py-1" onClick={() => ackTask(t.id)}>Ack</button>
                    <button className="border rounded px-2 py-1" onClick={() => completeTask(t.id)}>Complete</button>
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
