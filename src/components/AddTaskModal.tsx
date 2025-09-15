'use client';
import { useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void; // call after successful save to refresh list/calendar/canvas
};

const TASK_TYPES = [
  'Work',
  'Home',
  'Telework',
  'Office',
  'Errand',
  'Health',
  'Reminder',
  'Other',
];

export default function AddTaskModal({ open, onClose, onSaved }: Props) {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<string>('');
  const [taskDate, setTaskDate] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const canSave = !!taskTitle && !!taskDate && !!taskType && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle,
          taskType,
          taskDate, // ISO yyyy-mm-dd from <input type="date">
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved?.();
      onClose();
    } catch (e) {
      alert('Failed to save task. ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[560px] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add New Task</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium">Task</label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Describe the task…"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Date of Task</label>
            <input
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Type of Task</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="">Select type…</option>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
