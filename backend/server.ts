/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

// CareCircle — Phase 1 (Calendar + Tasks only) — ESLint clean
// How to run (dev):
//   1) npm i express cors helmet jsonwebtoken
//   2) npm i -D @types/node @types/express @types/cors @types/helmet @types/jsonwebtoken
//   3) npx tsx backend/server.ts

import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";

const VERSION = "CareCircle Phase-1 (Calendar+Tasks)";
const PORT = Number(process.env.PORT ?? 4000);

// ---------- App ----------
const app = express();

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "https:", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "connect-src": ["'self'", "blob:"],
        "frame-ancestors": ["'self'"],
      },
    },
  }),
);

app.use(
  cors({
    origin: (_origin, cb) => cb(null, true),
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------- Tiny types ----------
type Lang = "en" | "es" | "tl" | "hi";
type Role = "Owner" | "Family" | "Child" | "Caregiver" | "Relative";

interface User {
  id: string;
  name: string;
  role: Role;
  language: Lang;
  circleId: string;
}

type Repeat = "none" | "daily" | "weekly";

interface TimeLog {
  start: number;
  end?: number;
  notes?: string;
}

interface CalendarEvent {
  id: string;
  circleId: string;
  title: string;
  when: number;
  durationMin?: number;
  assignedTo?: string;
  completed?: boolean;
  timelogs?: TimeLog[];
  reminderIntervalMinutes?: number;
  __lastReminderAt?: number;
  __reminderCount?: number;
}

interface TaskItem {
  id: string;
  circleId: string;
  title: string;
  start?: number;
  due?: number;
  assignedTo?: string;
  completed?: boolean;
  timelogs?: TimeLog[];
  reminderIntervalMinutes?: number;
  __lastReminderAt?: number;
  __reminderCount?: number;
  repeat?: Repeat;
  // minor ack flags (present for UI compatibility; not enforced in P1)
  forMinor?: boolean;
  ackRequired?: boolean;
  photoProof?: boolean;
  ackAt?: number;
  ackBy?: string;
  __minorStage?: 0 | 1 | 2 | 3 | 4;
}

// ---------- In-memory DB (Phase-1 scope) ----------
const db = {
  users: new Map<string, User>(),
  events: new Map<string, CalendarEvent>(),
  tasks: new Map<string, TaskItem>(),
};

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// Seed: one circle with three users
const circleId = "c-1";
const uOwner: User = { id: "u-owner", name: "Owner", role: "Owner", language: "en", circleId };
const uFam: User = { id: "u-fam", name: "Ryan", role: "Family", language: "en", circleId };
const uChild: User = { id: "u-child", name: "Derek", role: "Child", language: "en", circleId };
[uOwner, uFam, uChild].forEach((u) => db.users.set(u.id, u));

// ---------- Auth (dev header) ----------
interface AuthedRequest extends Request {
  user?: User;
}
const DEV_ALLOW_HEADER = true;

function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (DEV_ALLOW_HEADER) {
    const id = String(req.headers["x-user-id"] ?? "");
    const user = id ? db.users.get(id) : undefined;
    if (user) {
      req.user = user;
      return next();
    }
  }
  return res.status(401).json({ error: "auth required" });
}

// ---------- Health ----------
app.get("/", (_req, res) => res.json({ ok: true, version: VERSION }));
app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---------- Calendar ----------
app.get("/api/calendar", auth, (req: AuthedRequest, res: Response) => {
  const cid = req.user!.circleId;
  const list = Array.from(db.events.values())
    .filter((e) => e.circleId === cid)
    .sort((a, b) => b.when - a.when);
  return res.json(list);
});

app.post("/api/calendar", auth, (req: AuthedRequest, res: Response) => {
  const { title, when, durationMin, assignedTo } = req.body as Partial<CalendarEvent>;
  if (!title || !when) return res.status(400).json({ error: "title and when required" });

  const ev: CalendarEvent = {
    id: uid("ev"),
    circleId: req.user!.circleId,
    title: String(title),
    when: Number(when),
    durationMin: durationMin != null ? Number(durationMin) : undefined,
    assignedTo: assignedTo ? String(assignedTo) : undefined,
  };
  db.events.set(ev.id, ev);
  return res.json(ev);
});

app.post("/api/calendar/:id/complete", auth, (req: AuthedRequest, res: Response) => {
  const ev = db.events.get(req.params.id);
  if (!ev) return res.status(404).json({ error: "not found" });
  if (ev.circleId !== req.user!.circleId) return res.status(403).json({ error: "forbidden" });
  ev.completed = true;
  db.events.set(ev.id, ev);
  return res.json({ ok: true });
});

app.post("/api/calendar/:id/timelog", auth, (req: AuthedRequest, res: Response) => {
  const ev = db.events.get(req.params.id);
  if (!ev) return res.status(404).json({ error: "not found" });
  if (ev.circleId !== req.user!.circleId) return res.status(403).json({ error: "forbidden" });

  const body = req.body as Partial<TimeLog>;
  const tl: TimeLog = {
    start: Number(body.start ?? Date.now()),
    end: body.end != null ? Number(body.end) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
  };
  ev.timelogs = ev.timelogs ?? [];
  ev.timelogs.push(tl);
  db.events.set(ev.id, ev);
  return res.json({ ok: true });
});

// ---------- Tasks ----------
app.get("/api/tasks", auth, (req: AuthedRequest, res: Response) => {
  const cid = req.user!.circleId;
  const list = Array.from(db.tasks.values())
    .filter((t) => t.circleId === cid)
    .sort((a, b) => (b.due ?? 0) - (a.due ?? 0));
  return res.json(list);
});

app.post("/api/tasks", auth, (req: AuthedRequest, res: Response) => {
  const body = req.body as Partial<TaskItem>;
  if (!body.title) return res.status(400).json({ error: "title required" });

  const t: TaskItem = {
    id: uid("tk"),
    circleId: req.user!.circleId,
    title: String(body.title),
    start: body.start != null ? Number(body.start) : undefined,
    due: body.due != null ? Number(body.due) : undefined,
    assignedTo: body.assignedTo ? String(body.assignedTo) : undefined,
    repeat: (body.repeat ?? "none") as Repeat,
    reminderIntervalMinutes:
      body.reminderIntervalMinutes != null ? Number(body.reminderIntervalMinutes) : undefined,
    forMinor: Boolean(body.forMinor),
    ackRequired: Boolean(body.ackRequired),
    photoProof: Boolean(body.photoProof),
    __minorStage: 0,
  };
  db.tasks.set(t.id, t);
  return res.json(t);
});

app.post("/api/tasks/:id/complete", auth, (req: AuthedRequest, res: Response) => {
  const t = db.tasks.get(req.params.id);
  if (!t) return res.status(404).json({ error: "not found" });
  if (t.circleId !== req.user!.circleId) return res.status(403).json({ error: "forbidden" });
  t.completed = true;
  db.tasks.set(t.id, t);
  // spawn next if repeating
  if (t.repeat && t.repeat !== "none") {
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const next: TaskItem = { ...t, id: uid("tk"), completed: false };
    if (t.repeat === "daily") {
      if (next.start) next.start += day;
      if (next.due) next.due += day;
    } else if (t.repeat === "weekly") {
      if (next.start) next.start += week;
      if (next.due) next.due += week;
    }
    db.tasks.set(next.id, next);
  }
  return res.json({ ok: true });
});

app.post("/api/tasks/:id/timelog", auth, (req: AuthedRequest, res: Response) => {
  const t = db.tasks.get(req.params.id);
  if (!t) return res.status(404).json({ error: "not found" });
  if (t.circleId !== req.user!.circleId) return res.status(403).json({ error: "forbidden" });

  const body = req.body as Partial<TimeLog>;
  const tl: TimeLog = {
    start: Number(body.start ?? Date.now()),
    end: body.end != null ? Number(body.end) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
  };
  t.timelogs = t.timelogs ?? [];
  t.timelogs.push(tl);
  db.tasks.set(t.id, t);
  return res.json({ ok: true });
});

// ---------- Start ----------
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`${VERSION} listening on http://127.0.0.1:${PORT}`);
});
