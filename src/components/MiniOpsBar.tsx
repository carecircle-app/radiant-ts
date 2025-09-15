"use client";

import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, DEFAULT_USER } from "../lib/clientEnv";

type Task = { id: string; title: string; completed?: boolean };

export default function MiniOpsBar() {
  const [status, setStatus] = useState<"ok"|"down"|"idle">("idle");
  const [openCount, setOpenCount] = useState<number|null>(null);
  const [err, setErr] = useState("");

  const headers = useMemo(
    () => ({ "x-user-id": DEFAULT_USER, "Content-Type": "application/json" }),
    []
  );

  useEffect(() => {
    let stop = false;
    async function run() {
      setErr("");
      try {
        const h = await fetch(`${API_BASE}/health`, { headers });
        if (!stop) setStatus(h.ok ? "ok" : "down");

        const t = await fetch(`${API_BASE}/api/tasks`, { headers });
        if (!t.ok) throw new Error(await t.text());
        const tasks = (await t.json()) as Task[];
        const open = tasks.filter(x => !x.completed).length;
        if (!stop) setOpenCount(open);
      } catch (e: any) {
        if (!stop) { setStatus("down"); setErr(e?.message || "Fetch failed"); }
      }
    }
    run();
    const id = setInterval(run, 20000);
    return () => { stop = true; clearInterval(id); };
  }, [headers]);

  const dot =
    status === "ok" ? "bg-emerald-500" :
    status === "down" ? "bg-rose-500" : "bg-slate-300";

  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
          <span className="text-sm">
            API: {status === "ok" ? "healthy" : status === "down" ? "unreachable" : "checking"}
          </span>
          {typeof openCount === "number" && (
            <span className="text-sm text-slate-500">â€¢ Open tasks: {openCount}</span>
          )}
          {err && (
            <span className="text-xs text-rose-600" title={err}>  {err.slice(0,60)}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin" className="btn btn-ghost" aria-label="Open Admin">Open Admin</a>
          <a href={`${API_BASE}/health`} target="_blank" rel="noreferrer" className="btn btn-ghost" aria-label="Open API Health">API Health</a>
        </div>
      </div>
    </div>
  );
}
