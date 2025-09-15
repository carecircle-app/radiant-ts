'use client';
import { useEffect, useState } from 'react';
import TaskModal from './TaskModal';

type Row = {
  id: string;
  name: string;
  date: string;    // ISO string from API
  task: string;
  location: string;
};

export default function TaskTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/tasks');
    const data = await res.json();
    // normalize date -> yyyy-mm-dd for display
    const mapped: Row[] = data.map((r: any) => ({
      ...r,
      date: r.date?.slice(0, 10),
    }));
    setRows(mapped);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Delete this task?')) return;
    const res = await fetch('/api/tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load();
    else alert('Delete failed');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Task Tracker</h1>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          onClick={() => { setEditRow(null); setOpen(true); }}
        >
          Add New Task
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-4" colSpan={5}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-4" colSpan={5}>No tasks yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3">{r.task}</td>
                <td className="px-4 py-3">{r.location}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      title="Edit"
                      className="rounded p-2 hover:bg-slate-100"
                      onClick={() => { setEditRow(r); setOpen(true); }}
                    >🖊️</button>
                    <button
                      title="Delete"
                      className="rounded p-2 hover:bg-slate-100"
                      onClick={() => remove(r.id)}
                    >🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TaskModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={load}
        initial={editRow ? {
          id: editRow.id,
          name: editRow.name,
          date: editRow.date,
          task: editRow.task,
          location: editRow.location,
        } : null}
      />
    </div>
  );
}
