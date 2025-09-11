/*
 * CareCircle — One‑File Server (TypeScript/Express)
 * Final Full Script v2 — Box 1–7 Patch Set A++ (single file)
 *
 * WHAT'S NEW vs v1 (highlights)
 * - Box 1: Web Push (VAPID) endpoints + optional Twilio SMS fan‑out; explicit "disruptive-alert" payload
 * - Box 2: Task due‑date reminders + escalation; simple recurring tasks; rewards points on completes
 * - Box 3: Member REMOVE endpoint; lightweight in‑memory AUDIT trail
 * - Box 4: Health logs (/api/health/logs), Vitals with thresholds (/api/vitals, /api/vitals/thresholds), Reports CSV/JSON
 * - Box 5: Groups + minimal Chat (rooms/messages) with file attachments by fileId
 * - Box 6: Location store (/api/users/location), Geofences (/api/geofences) + cron enter/exit; Panic (/api/panic); Heartbeat stale checks
 * - Box 7: Provider teaser (/api/features/providers); Regional pricing (/api/pricing)
 * - Global: Country→default language mapping (PH→en) applied on location updates; richer i18n
 *
 * How to run
 * 1) npm i express cors helmet jsonwebtoken web-push twilio
 * 2) npx tsx backend/server.ts   (or tsc + node)
 *
 * IMPORTANT ENV (all optional, feature‑gated):
 *   PORT=4000
 *   JWT_SECRET=supersecret
 *   DEV_ALLOW_HEADER=1
 *   ALLOWED_ORIGINS=http://localhost:3000
 *   FILES_DIR=./uploads
 *   LOCAL_PRESIGN=1
 *   # Web Push (required for push):
 *   VAPID_PUBLIC_KEY=...    VAPID_PRIVATE_KEY=...
 *   VAPID_SUBJECT=mailto:you@example.com
 *   # Twilio SMS (optional):
 *   TWILIO_ACCOUNT_SID=...  TWILIO_AUTH_TOKEN=...
 *   TWILIO_FROM=+15551234567
 */

 
import cors from 'cors'
import crypto from 'crypto'
import express, { Request, Response } from 'express'
import fs from 'fs'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import path from 'path'

// Soft/optional deps
const webpush = (() => {
  try {
    return require('web-push')
  } catch {
    return null
  }
})()
const twilio = (() => {
  try {
    return require('twilio')
  } catch {
    return null
  }
})()

// ---------------------------- Config ----------------------------
const PORT = Number(process.env.PORT || 4000)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const DEV_ALLOW_HEADER = process.env.DEV_ALLOW_HEADER === '1'
const LOCAL_PRESIGN = process.env.LOCAL_PRESIGN !== '0' // default ON for demo
const FILES_DIR = path.resolve(process.env.FILES_DIR || './uploads')
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173'
).split(',')
const VERSION = 'CareCircle One‑File Server v2'

if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true })

// ---------------------------- App Init ----------------------------
const app = express()

// Helmet with CSP tuned for EventSource (SSE), Push, and same-origin APIs
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'connect-src': ["'self'", 'blob:'],
        'frame-ancestors': ["'self'"],
      },
    },
  }),
)

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
      return cb(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

// ---------------------------- Tiny Rate Limiter ----------------------------
const rateMap = new Map<string, { ts: number; count: number }>()
const RATE_WINDOW_MS = 10_000 // 10s
const RATE_MAX = 100 // 100 req / 10s / IP
app.use((req, res, next) => {
  const ip = (req.headers['cf-connecting-ip'] as string) || req.ip || 'unknown'
  const now = Date.now()
  const entry = rateMap.get(ip) || { ts: now, count: 0 }
  if (now - entry.ts > RATE_WINDOW_MS) {
    entry.ts = now
    entry.count = 0
  }
  entry.count++
  rateMap.set(ip, entry)
  if (entry.count > RATE_MAX)
    return res.status(429).json({ error: 'Too many requests' })
  next()
})

// ---------------------------- Types ----------------------------

type Lang = 'en' | 'es' | 'tl' | 'hi'

type Role = 'Owner' | 'Caregiver' | 'Family' | 'Child'

interface User {
  id: string
  name: string
  email?: string
  phone?: string
  role: Role
  language: Lang
  circleId?: string
  donationOptIn?: boolean
  twoFASecret?: string
  lastHeartbeatAt?: number
  country?: string
  lastKnownLocation?: { lat: number; lon: number; ts: number }
}

interface Circle {
  id: string
  name: string
}

interface TimeLog {
  start: number
  end?: number
  notes?: string
}

interface EventItem {
  id: string
  circleId: string
  title: string
  when: number
  durationMin?: number
  assignedTo?: string
  completed?: boolean
  proofKey?: string
  timelogs?: TimeLog[]
  reminderIntervalMinutes?: number
  __lastReminderAt?: number
  __reminderCount?: number
}

type Repeat = 'none' | 'daily' | 'weekly'

interface TaskItem {
  id: string
  circleId: string
  title: string
  start?: number
  due?: number
  assignedTo?: string
  completed?: boolean
  requireProof?: boolean
  proofKey?: string
  timelogs?: TimeLog[]
  reminderIntervalMinutes?: number
  __lastReminderAt?: number
  __reminderCount?: number
  repeat?: Repeat
}

interface MedItem {
  id: string
  circleId: string
  name: string
  dosage: string
  scheduleTimes: string[]
  assignedTo?: string
}

interface FileItem {
  id: string
  circleId: string
  key: string
  size: number
  mime: string
  path: string
}

interface HealthLog {
  id: string
  circleId: string
  userId?: string
  ts: number
  mood?: number
  pain?: number
  sleepHours?: number
  notes?: string
}

interface Vital {
  id: string
  circleId: string
  userId?: string
  ts: number
  kind: 'bp' | 'glucose' | 'weight' | 'spo2' | 'hr'
  value: number
  aux?: any
}

interface VitalThresholds {
  circleId: string
  kind: Vital['kind']
  min?: number
  max?: number
}

interface Geofence {
  id: string
  circleId: string
  name: string
  lat: number
  lon: number
  radiusM: number
}

interface ChatRoom {
  id: string
  circleId: string
  name: string
  memberIds: string[]
}

interface ChatMessage {
  id: string
  roomId: string
  userId: string
  ts: number
  text?: string
  fileId?: string
}

interface AuditRow {
  ts: number
  actorId: string
  action: string
  subjectType: string
  subjectId?: string
  meta?: any
}

// ---------------------------- In-Memory DB ----------------------------

const db = {
  users: new Map<string, User>(),
  circles: new Map<string, Circle>(),
  members: new Set<string>(), // `${circleId}:${userId}`
  events: new Map<string, EventItem>(),
  tasks: new Map<string, TaskItem>(),
  meds: new Map<string, MedItem>(),
  files: new Map<string, FileItem>(),
  magic: new Map<string, { code: string; uid?: string; ts: number }>(), // email -> code
  healthLogs: new Map<string, HealthLog>(),
  vitals: new Map<string, Vital>(),
  thresholds: new Map<string, VitalThresholds>(), // `${circleId}:${kind}`
  geofences: new Map<string, Geofence>(),
  rooms: new Map<string, ChatRoom>(),
  messages: new Map<string, ChatMessage>(),
  pushSubs: new Map<string, Set<any>>(), // circleId -> Set<PushSubscription>
  rewards: new Map<string, number>(), // userId -> points
  audits: [] as AuditRow[],
}

type ID = string
function audit(
  actorId: string,
  action: string,
  subjectType: string,
  subjectId?: string,
  meta?: any,
) {
  db.audits.push({
    ts: Date.now(),
    actorId,
    action,
    subjectType,
    subjectId,
    meta,
  })
}

function id(prefix: string) {
  return `${prefix}-${crypto.randomBytes(6).toString('hex')}`
}
function memberKey(c: string, u: string) {
  return `${c}:${u}`
}

// Seed circle & users
const seedCircle: Circle = { id: 'c-1', name: 'Family Circle' }
db.circles.set(seedCircle.id, seedCircle)
const uOwner: User = {
  id: 'u-owner',
  name: 'Owner',
  email: 'owner@example.com',
  role: 'Owner',
  language: 'en',
  circleId: seedCircle.id,
  donationOptIn: false,
}
const uCare: User = {
  id: 'u-care',
  name: 'Caregiver Ana',
  role: 'Caregiver',
  language: 'es',
  circleId: seedCircle.id,
}
const uFam: User = {
  id: 'u-fam',
  name: 'Ryan',
  role: 'Family',
  language: 'en',
  circleId: seedCircle.id,
}
const uChild: User = {
  id: 'u-child',
  name: 'Derek',
  role: 'Child',
  language: 'tl',
  circleId: seedCircle.id,
}
;[uOwner, uCare, uFam, uChild].forEach((u) => db.users.set(u.id, u))
;[
  memberKey(seedCircle.id, uOwner.id),
  memberKey(seedCircle.id, uCare.id),
  memberKey(seedCircle.id, uFam.id),
  memberKey(seedCircle.id, uChild.id),
].forEach((k) => db.members.add(k))

// ---------------------------- i18n ----------------------------

const i18n: Record<Lang, Record<string, (p?: any) => string>> = {
  en: {
    reminder_task: (p) => `Reminder: ${p.title}`,
    reminder_event: (p) =>
      `Reminder: ${p.title} at ${new Date(p.when).toLocaleString()}`,
    escalation: (p) => `Escalation: ${p.title} still not completed.`,
    child_restrict: (p) => `Device restrictions suggested for ${p.name}.`,
    disruptive_alert: () => `Disruptive alert triggered.`,
    panic: (p) =>
      `PANIC: ${p.reason || 'Emergency'} @ ${p.lat?.toFixed?.(3)},${p.lon?.toFixed?.(3)}`,
    geofence_enter: (p) => `Entered geofence: ${p.name}`,
    geofence_exit: (p) => `Exited geofence: ${p.name}`,
    vitals_alert: (p) => `Vitals alert: ${p.kind}=${p.value}`,
    inactivity: (p) => `No heartbeat from ${p.name} for ${p.min} min`,
    connected: () => `Connected to live updates`,
  },
  es: {
    reminder_task: (p) => `Recordatorio: ${p.title}`,
    reminder_event: (p) =>
      `Recordatorio: ${p.title} a las ${new Date(p.when).toLocaleString()}`,
    escalation: (p) => `Escalación: ${p.title} aún sin completar.`,
    child_restrict: (p) =>
      `Restricciones de dispositivo sugeridas para ${p.name}.`,
    disruptive_alert: () => `Alerta disruptiva activada.`,
    panic: (p) =>
      `PÁNICO: ${p.reason || 'Emergencia'} @ ${p.lat?.toFixed?.(3)},${p.lon?.toFixed?.(3)}`,
    geofence_enter: (p) => `Entró en geocerca: ${p.name}`,
    geofence_exit: (p) => `Salió de geocerca: ${p.name}`,
    vitals_alert: (p) => `Alerta de signos vitales: ${p.kind}=${p.value}`,
    inactivity: (p) => `Sin actividad de ${p.name} por ${p.min} min`,
    connected: () => `Conectado a actualizaciones en vivo`,
  },
  tl: {
    reminder_task: (p) => `Paalala: ${p.title}`,
    reminder_event: (p) =>
      `Paalala: ${p.title} sa ${new Date(p.when).toLocaleString()}`,
    escalation: (p) => `Babala: hindi pa natatapos ang ${p.title}.`,
    child_restrict: (p) =>
      `Iminumungkahi ang paghihigpit sa device para kay ${p.name}.`,
    disruptive_alert: () => `Naka-activate ang malakas na alerto.`,
    panic: (p) =>
      `PANIC: ${p.reason || 'Emerhensiya'} @ ${p.lat?.toFixed?.(3)},${p.lon?.toFixed?.(3)}`,
    geofence_enter: (p) => `Pumasok sa geofence: ${p.name}`,
    geofence_exit: (p) => `Lumabas sa geofence: ${p.name}`,
    vitals_alert: (p) => `Alerto sa vital: ${p.kind}=${p.value}`,
    inactivity: (p) => `Walang heartbeat mula kay ${p.name} sa ${p.min} min`,
    connected: () => `Kumonekta sa live updates`,
  },
  hi: {
    reminder_task: (p) => `स्मरण: ${p.title}`,
    reminder_event: (p) =>
      `स्मरण: ${p.title} ${new Date(p.when).toLocaleString()} पर`,
    escalation: (p) => `एस्केलेशन: ${p.title} अब तक पूरा नहीं हुआ।`,
    child_restrict: (p) => `${p.name} के लिए डिवाइस प्रतिबंध सुझाए गए।`,
    disruptive_alert: () => `विघटनकारी अलर्ट सक्रिय।`,
    panic: (p) =>
      `पैनिक: ${p.reason || 'आपातकाल'} @ ${p.lat?.toFixed?.(3)},${p.lon?.toFixed?.(3)}`,
    geofence_enter: (p) => `जियोफेंस में प्रवेश किया: ${p.name}`,
    geofence_exit: (p) => `जियोफेंस से बाहर निकले: ${p.name}`,
    vitals_alert: (p) => `वाइटल्स अलर्ट: ${p.kind}=${p.value}`,
    inactivity: (p) => `${p.name} से ${p.min} मिनट से कोई हार्टबीट नहीं`,
    connected: () => `लाइव अपडेट से जुड़ गए`,
  },
}

function t(userId: string, key: string, params?: any) {
  const u = db.users.get(userId)
  const lang: Lang = (u?.language || 'en') as Lang
  const pack = i18n[lang] || i18n.en
  const fn = pack[key] || i18n.en[key]
  return fn ? fn(params) : `[${key}]`
}

const defaultLocaleByCountry: Record<string, Lang> = { PH: 'en' }

// ---------------------------- Auth ----------------------------

interface AuthedRequest extends Request {
  user?: User
}

function auth(req: AuthedRequest, res: Response, next: Function) {
  const hdr = req.headers['authorization']
  if (hdr?.startsWith('Bearer ')) {
    try {
      const token = hdr.slice(7)
      const payload = jwt.verify(token, JWT_SECRET) as any
      const u = db.users.get(payload.uid)
      if (!u) return res.status(401).json({ error: 'user not found' })
      ;(req as AuthedRequest).user = u
      return next()
    } catch (e) {
      return res.status(401).json({ error: 'invalid token' })
    }
  }
  if (DEV_ALLOW_HEADER) {
    const uid = (req.headers['x-user-id'] as string) || ''
    if (uid && db.users.has(uid)) {
      ;(req as AuthedRequest).user = db.users.get(uid)!
      return next()
    }
  }
  return res.status(401).json({ error: 'auth required' })
}

function ensureCircleAccess(user: User, circleId: string) {
  const key = memberKey(circleId, user.id)
  if (!db.members.has(key)) throw new Error('forbidden')
}

// ---------------------------- Push & SMS Setup ----------------------------

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:example@example.com'
if (webpush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

const smsEnabled = !!(
  twilio &&
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_FROM
)
const smsClient = smsEnabled
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

// ---------------------------- SSE Hub ----------------------------

type Client = { res: Response; userId: string; circleId: string }
const clients = new Map<string, Set<Client>>() // circleId -> set of clients

function sseSend(res: Response, event: string, data: any) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

function pushSend(circleId: string, payload: any) {
  if (!webpush || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return
  const set = db.pushSubs.get(circleId)
  if (!set) return
  for (const sub of set) {
    webpush.sendNotification(sub, JSON.stringify(payload)).catch(() => {
      /* ignore */
    })
  }
}

async function smsSend(circleId: string, message: string) {
  if (!smsClient) return
  const recipients = Array.from(db.users.values()).filter(
    (u) => db.members.has(memberKey(circleId, u.id)) && u.phone,
  )
  for (const r of recipients) {
    try {
      await smsClient.messages.create({
        to: r.phone,
        from: process.env.TWILIO_FROM,
        body: message,
      })
    } catch {
      /* ignore */
    }
  }
}

function fanout(circleId: string, kind: string, message: string, extra?: any) {
  const payload = { kind, message, ...extra }
  const set = clients.get(circleId)
  if (set) for (const c of set) sseSend(c.res, 'notify', payload)
  pushSend(circleId, payload)
  smsSend(circleId, message)
}

// ---------------------------- Utils ----------------------------

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.\-]/g, '_')
}
function now() {
  return Date.now()
}

// ---------------------------- Readiness ----------------------------

app.get('/', (req, res) => res.json({ ok: true, version: VERSION }))
app.get('/health', (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() }),
)
app.get('/ready', (req, res) =>
  res.json({
    ok: true,
    push: !!(webpush && VAPID_PUBLIC_KEY),
    sms: smsEnabled,
    filesDir: FILES_DIR,
    version: VERSION,
  }),
)

// ---------------------------- Auth (Magic Link) ----------------------------

app.post('/api/auth/magic/request', (req, res) => {
  const email = String(req.body?.email || '').toLowerCase()
  if (!email) return res.status(400).json({ error: 'email required' })
  const code = (Math.floor(Math.random() * 900000) + 100000).toString()
  db.magic.set(email, { code, ts: now() })
  return res.json({ ok: true, debugCode: code })
})

app.post('/api/auth/magic/verify', (req, res) => {
  const email = String(req.body?.email || '').toLowerCase()
  const code = String(req.body?.code || '')
  const entry = db.magic.get(email)
  if (!entry || entry.code !== code || now() - entry.ts > 15 * 60_000)
    return res.status(400).json({ error: 'invalid or expired code' })
  let user = Array.from(db.users.values()).find(
    (u) => u.email?.toLowerCase() === email,
  )
  if (!user) {
    user = {
      id: id('u'),
      name: email.split('@')[0],
      email,
      role: 'Family',
      language: 'en',
      circleId: seedCircle.id,
    }
    db.users.set(user.id, user)
    db.members.add(memberKey(seedCircle.id, user.id))
    audit(user.id, 'register', 'user', user.id, { email })
  }
  const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: '7d' })
  return res.json({ ok: true, token })
})

// Optional: simple register (email capture/consent)
app.post('/api/auth/register', (req, res) => {
  const { email, name, consentEmail } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email required' })
  const existing = Array.from(db.users.values()).find(
    (u) => u.email?.toLowerCase() === String(email).toLowerCase(),
  )
  if (existing)
    return res.json({ ok: true, id: existing.id, consentEmail: !!consentEmail })
  const u: User = {
    id: id('u'),
    name: name || String(email).split('@')[0],
    email,
    role: 'Family',
    language: 'en',
    circleId: seedCircle.id,
  }
  db.users.set(u.id, u)
  db.members.add(memberKey(seedCircle.id, u.id))
  audit(u.id, 'register', 'user', u.id, { consentEmail: !!consentEmail })
  return res.json({ ok: true, id: u.id })
})

// ---------------------------- Me ----------------------------

app.get('/me', auth, (req: AuthedRequest, res) => res.json(req.user))

// ---------------------------- Pricing & Plans ----------------------------

app.get('/api/plans', auth, (req: AuthedRequest, res) => {
  const base = {
    free: {
      name: 'Free',
      price: 0,
      donation: true,
      donationAmount: 1.5,
      features: [
        'Core calendar & tasks',
        'Meds & reminders',
        'Live notifications (SSE)',
        'File uploads (limited)',
      ],
    },
    lite: {
      name: 'Lite',
      price: 4.99,
      donation: false,
      features: [
        'Everything in Free',
        'Priority reminders',
        'Checklist templates',
        'Multi-language UX',
      ],
    },
    elite: {
      name: 'Elite',
      price: 9.99,
      donation: false,
      features: [
        'All Lite features',
        'Advanced automation',
        'Export/reporting',
        'Priority support',
      ],
    },
  }
  return res.json(base)
})

app.get('/api/pricing', auth, (req: AuthedRequest, res) => {
  const country = String(
    req.query.country || req.user?.country || 'US',
  ).toUpperCase()
  const byCountry: Record<string, any> = {
    US: { lite: 4.99, elite: 9.99, donationFree: 1.5 },
    PH: { lite: 149, elite: 299, currency: 'PHP', donationFree: 75 },
  }
  const p = byCountry[country] || byCountry.US
  return res.json({ country, ...p })
})

// ---------------------------- Users & Members ----------------------------

app.get('/api/users', auth, (req: AuthedRequest, res) => {
  const u = req.user!
  const cid = u.circleId || seedCircle.id
  const list = Array.from(db.users.values()).filter((x) =>
    db.members.has(memberKey(cid, x.id)),
  )
  return res.json(list)
})

app.post('/api/users', auth, (req: AuthedRequest, res) => {
  const { name, email, phone, role, language } = req.body || {}
  if (!name || !role)
    return res.status(400).json({ error: 'name and role required' })
  const u: User = {
    id: id('u'),
    name,
    email,
    phone,
    role,
    language: (language || 'en') as Lang,
  }
  db.users.set(u.id, u)
  audit(req.user!.id, 'create', 'user', u.id, { role })
  return res.json(u)
})

app.post('/api/users/:id/language', auth, (req: AuthedRequest, res) => {
  const uid = req.params.id
  const language = String(req.body?.language || 'en') as Lang
  const u = db.users.get(uid)
  if (!u) return res.status(404).json({ error: 'user not found' })
  u.language = language
  db.users.set(uid, u)
  audit(req.user!.id, 'update', 'user', uid, { language })
  return res.json({ ok: true })
})

app.get('/api/circles/:circleId/members', auth, (req: AuthedRequest, res) => {
  const { circleId } = req.params
  try {
    ensureCircleAccess(req.user!, circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const list = Array.from(db.users.values()).filter((u) =>
    db.members.has(memberKey(circleId, u.id)),
  )
  return res.json(list)
})

app.post('/api/circles/:circleId/members', auth, (req: AuthedRequest, res) => {
  const { circleId } = req.params
  const { userId } = req.body || {}
  try {
    ensureCircleAccess(req.user!, circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  if (!db.users.has(userId))
    return res.status(404).json({ error: 'user not found' })
  db.members.add(memberKey(circleId, userId))
  const u = db.users.get(userId)!
  if (!u.circleId) {
    u.circleId = circleId
    db.users.set(u.id, u)
  }
  audit(req.user!.id, 'member_add', 'circle', circleId, { userId })
  fanout(circleId, 'member_added', `Member added: ${u.name}`)
  return res.json({ ok: true })
})

app.delete(
  '/api/circles/:circleId/members/:userId',
  auth,
  (req: AuthedRequest, res) => {
    const { circleId, userId } = req.params
    try {
      ensureCircleAccess(req.user!, circleId)
    } catch {
      return res.status(403).json({ error: 'forbidden' })
    }
    db.members.delete(memberKey(circleId, userId))
    audit(req.user!.id, 'member_remove', 'circle', circleId, { userId })
    fanout(circleId, 'member_removed', `Member removed: ${userId}`)
    return res.json({ ok: true })
  },
)

app.post('/api/children/:userId/restrict', auth, (req: AuthedRequest, res) => {
  const uid = req.params.userId
  const user = db.users.get(uid)
  if (!user) return res.status(404).json({ error: 'user not found' })
  const cid = req.user!.circleId || seedCircle.id
  try {
    ensureCircleAccess(req.user!, cid)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  fanout(
    cid,
    'child_restrict',
    t(req.user!.id, 'child_restrict', { name: user.name }),
  )
  return res.json({ ok: true })
})

// ---------------------------- Calendar ----------------------------

app.get('/api/calendar', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const list = Array.from(db.events.values())
    .filter((e) => e.circleId === cid)
    .sort((a, b) => b.when - a.when)
  return res.json(list)
})

app.post('/api/calendar', auth, (req: AuthedRequest, res) => {
  const {
    title,
    when,
    durationMin,
    assignedTo,
    reminderIntervalMinutes,
    circleId,
  } = req.body || {}
  const cid = circleId || req.user!.circleId || seedCircle.id
  try {
    ensureCircleAccess(req.user!, cid)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  if (!title || !when)
    return res.status(400).json({ error: 'title and when required' })
  const e: EventItem = {
    id: id('ev'),
    title,
    when: Number(when),
    durationMin: durationMin ? Number(durationMin) : undefined,
    assignedTo,
    reminderIntervalMinutes: reminderIntervalMinutes
      ? Number(reminderIntervalMinutes)
      : undefined,
    circleId: cid,
  }
  db.events.set(e.id, e)
  audit(req.user!.id, 'create', 'event', e.id, { title })
  fanout(cid, 'event_created', `Event: ${title}`)
  return res.json(e)
})

app.post('/api/calendar/:id/complete', auth, (req: AuthedRequest, res) => {
  const e = db.events.get(req.params.id)
  if (!e) return res.status(404).json({ error: 'not found' })
  try {
    ensureCircleAccess(req.user!, e.circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  e.completed = true
  db.events.set(e.id, e)
  audit(req.user!.id, 'complete', 'event', e.id)
  if (e.assignedTo) incReward(e.assignedTo, 5)
  fanout(e.circleId, 'event_completed', `Completed: ${e.title}`)
  return res.json({ ok: true })
})

app.post('/api/calendar/:id/timelog', auth, (req: AuthedRequest, res) => {
  const e = db.events.get(req.params.id)
  if (!e) return res.status(404).json({ error: 'not found' })
  try {
    ensureCircleAccess(req.user!, e.circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const tl: TimeLog = {
    start: Number(req.body?.start),
    end: req.body?.end ? Number(req.body.end) : undefined,
    notes: req.body?.notes,
  }
  e.timelogs = e.timelogs || []
  e.timelogs.push(tl)
  db.events.set(e.id, e)
  audit(req.user!.id, 'timelog_add', 'event', e.id)
  return res.json({ ok: true })
})

app.post('/api/calendar/:id/proof', auth, (req: AuthedRequest, res) => {
  const e = db.events.get(req.params.id)
  if (!e) return res.status(404).json({ error: 'not found' })
  try {
    ensureCircleAccess(req.user!, e.circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const key = String(req.body?.key || '')
  e.proofKey = key
  db.events.set(e.id, e)
  audit(req.user!.id, 'proof_attach', 'event', e.id, { key })
  return res.json({ ok: true })
})

// ---------------------------- Tasks ----------------------------

app.get('/api/tasks', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const list = Array.from(db.tasks.values())
    .filter((t) => t.circleId === cid)
    .sort((a, b) => (b.due || b.start || 0) - (a.due || a.start || 0))
  return res.json(list)
})

app.post('/api/tasks', auth, (req: AuthedRequest, res) => {
  const {
    title,
    start,
    due,
    assignedTo,
    reminderIntervalMinutes,
    requireProof,
    circleId,
    repeat,
  } = req.body || {}
  const cid = circleId || req.user!.circleId || seedCircle.id
  try {
    ensureCircleAccess(req.user!, cid)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  if (!title) return res.status(400).json({ error: 'title required' })
  const t: TaskItem = {
    id: id('tk'),
    title,
    start: start ? Number(start) : undefined,
    due: due ? Number(due) : undefined,
    assignedTo,
    reminderIntervalMinutes: reminderIntervalMinutes
      ? Number(reminderIntervalMinutes)
      : undefined,
    requireProof: !!requireProof,
    circleId: cid,
    repeat: (repeat || 'none') as Repeat,
  }
  db.tasks.set(t.id, t)
  audit(req.user!.id, 'create', 'task', t.id, { repeat: t.repeat })
  fanout(cid, 'task_created', `Task: ${title}`)
  return res.json(t)
})

app.post('/api/tasks/:id/complete', auth, (req: AuthedRequest, res) => {
  const tsk = db.tasks.get(req.params.id)
  if (!tsk) return res.status(404).json({ error: 'not found' })
  try {
    ensureCircleAccess(req.user!, tsk.circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  tsk.completed = true
  db.tasks.set(tsk.id, tsk)
  audit(req.user!.id, 'complete', 'task', tsk.id)
  if (tsk.assignedTo) incReward(tsk.assignedTo, 3)
  spawnNextIfRepeating(tsk)
  fanout(tsk.circleId, 'task_completed', `Completed: ${tsk.title}`)
  return res.json({ ok: true })
})

app.post('/api/tasks/:id/timelog', auth, (req: AuthedRequest, res) => {
  const tsk = db.tasks.get(req.params.id)
  if (!tsk) return res.status(404).json({ error: 'not found' })
  try {
    ensureCircleAccess(req.user!, tsk.circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const tl: TimeLog = {
    start: Number(req.body?.start),
    end: req.body?.end ? Number(req.body.end) : undefined,
    notes: req.body?.notes,
  }
  tsk.timelogs = tsk.timelogs || []
  tsk.timelogs.push(tl)
  db.tasks.set(tsk.id, tsk)
  audit(req.user!.id, 'timelog_add', 'task', tsk.id)
  return res.json({ ok: true })
})

app.post('/api/tasks/:id/proof', auth, (req: AuthedRequest, res) => {
  const tsk = db.tasks.get(req.params.id)
  if (!tsk) return res.status(404).json({ error: 'not found' })
  try {
    ensureCircleAccess(req.user!, tsk.circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const key = String(req.body?.key || '')
  tsk.proofKey = key
  db.tasks.set(tsk.id, tsk)
  audit(req.user!.id, 'proof_attach', 'task', tsk.id, { key })
  return res.json({ ok: true })
})

// ---------------------------- Meds ----------------------------

app.get('/api/meds', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const list = Array.from(db.meds.values()).filter((m) => m.circleId === cid)
  return res.json(list)
})

app.post('/api/meds', auth, (req: AuthedRequest, res) => {
  const { name, dosage, scheduleTimes, assignedTo, circleId } = req.body || {}
  const cid = circleId || req.user!.circleId || seedCircle.id
  try {
    ensureCircleAccess(req.user!, cid)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  if (!name || !dosage)
    return res.status(400).json({ error: 'name and dosage required' })
  const m: MedItem = {
    id: id('md'),
    name,
    dosage,
    scheduleTimes: Array.isArray(scheduleTimes) ? scheduleTimes : [],
    assignedTo,
    circleId: cid,
  }
  db.meds.set(m.id, m)
  audit(req.user!.id, 'create', 'med', m.id, { name })
  fanout(cid, 'med_created', `Med: ${name}`)
  return res.json(m)
})

app.post('/api/meds/:id/mark', auth, (req: AuthedRequest, res) => {
  const med = db.meds.get(req.params.id)
  if (!med) return res.status(404).json({ error: 'not found' })
  try {
    ensureCircleAccess(req.user!, med.circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const status = String(req.body?.status || '')
  if (status === 'taken' && med.assignedTo) incReward(med.assignedTo, 1)
  fanout(med.circleId, 'med_' + status, `${med.name} ${status}`)
  return res.json({ ok: true })
})

// ---------------------------- Checklists ----------------------------

app.post('/api/checklists/auto', auth, (req: AuthedRequest, res) => {
  const { eventId } = req.body || {}
  const e = db.events.get(eventId)
  if (!e) return res.status(404).json({ error: 'event not found' })
  try {
    ensureCircleAccess(req.user!, e.circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const title = e.title.toLowerCase()
  const items: { id: ID; text: string }[] = []
  const push = (text: string) => items.push({ id: id('it'), text })
  if (title.includes('doctor') || title.includes('clinic')) {
    push('Photo ID')
    push('Insurance card')
    push('List of medications')
    push('Questions for the doctor')
    push('Previous test results')
  }
  if (title.includes('lab')) {
    push('Lab order/requisition')
    push('Fasting as required')
    push('Insurance card')
  }
  if (title.includes('school')) {
    push('Assignment list')
    push('Supplies')
    push('Parent/guardian contact')
  }
  if (!items.length) {
    push('Notes')
    push('Phone & charger')
    push('Water & snack')
  }
  return res.json({ eventId, items })
})

// ---------------------------- Files (Presign + Local PUT) ----------------------------

app.post('/api/uploads/presign', auth, (req: AuthedRequest, res) => {
  const { fileName, fileType, fileSize, circleId } = req.body || {}
  const cid = circleId || req.user!.circleId || seedCircle.id
  try {
    ensureCircleAccess(req.user!, cid)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const safeName = sanitizeName(String(fileName || 'file'))
  const key = `${cid}/${Date.now()}_${safeName}`
  if (LOCAL_PRESIGN) {
    const url = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(key)}`
    return res.json({ ok: true, provider: 'local', url, key })
  }
  const url = `https://example-s3/${key}`
  return res.json({ ok: true, provider: 's3', url, key })
})

app.put(
  '/uploads/:key(*)',
  express.raw({ type: '*/*', limit: '50mb' }),
  (req: AuthedRequest, res) => {
    const key = req.params.key
    const filePath = path.join(FILES_DIR, key)
    const dir = path.dirname(filePath)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(filePath, req.body)
    return res.status(200).end()
  },
)

app.post('/api/uploads/complete', auth, (req: AuthedRequest, res) => {
  const { key, size, mime, circleId } = req.body || {}
  const cid = circleId || req.user!.circleId || seedCircle.id
  try {
    ensureCircleAccess(req.user!, cid)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const filePath = path.join(FILES_DIR, key)
  const exists = fs.existsSync(filePath)
  const f: FileItem = {
    id: id('f'),
    circleId: cid,
    key,
    size: Number(size || 0),
    mime: String(mime || 'application/octet-stream'),
    path: exists ? filePath : '',
  }
  db.files.set(f.id, f)
  audit(req.user!.id, 'file_upload', 'file', f.id, { key })
  fanout(cid, 'file_uploaded', `File: ${key}`)
  return res.json(f)
})

app.get('/api/files', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const list = Array.from(db.files.values())
    .filter((f) => f.circleId === cid)
    .sort((a, b) => a.key.localeCompare(b.key))
  return res.json(list)
})

app.get('/api/files/:id', auth, (req: AuthedRequest, res) => {
  const f = db.files.get(req.params.id)
  if (!f) return res.status(404).json({ error: 'not found' })
  try {
    ensureCircleAccess(req.user!, f.circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const url = `${req.protocol}://${req.get('host')}/download/${encodeURIComponent(f.id)}`
  return res.json({ url })
})

app.get('/download/:id', (req, res) => {
  const f = db.files.get(req.params.id)
  if (!f || !f.path || !fs.existsSync(f.path)) return res.status(404).end()
  res.setHeader('Content-Type', f.mime)
  fs.createReadStream(f.path).pipe(res)
})

// ---------------------------- Web Push ----------------------------

app.get('/vapidPublicKey', (req, res) => {
  if (!VAPID_PUBLIC_KEY)
    return res.status(501).json({ error: 'push not configured' })
  return res.json({ publicKey: VAPID_PUBLIC_KEY })
})

app.post('/api/push/subscribe', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const sub = req.body
  if (!sub || !sub.endpoint)
    return res.status(400).json({ error: 'invalid subscription' })
  if (!db.pushSubs.has(cid)) db.pushSubs.set(cid, new Set())
  db.pushSubs.get(cid)!.add(sub)
  audit(req.user!.id, 'push_sub', 'circle', cid, { endpoint: sub.endpoint })
  return res.json({ ok: true })
})

// ---------------------------- SSE ----------------------------

app.get('/api/sse', auth, (req: AuthedRequest, res) => {
  const circleId = String(
    req.query.circleId || req.user!.circleId || seedCircle.id,
  )
  try {
    ensureCircleAccess(req.user!, circleId)
  } catch {
    return res.status(403).end()
  }
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
  const client: Client = { res, userId: req.user!.id, circleId }
  if (!clients.has(circleId)) clients.set(circleId, new Set())
  clients.get(circleId)!.add(client)
  sseSend(res, 'notify', {
    kind: 'connected',
    message: t(req.user!.id, 'connected'),
  })
  req.on('close', () => {
    const set = clients.get(circleId)
    if (set) {
      set.delete(client)
      if (set.size === 0) clients.delete(circleId)
    }
  })
})

// ---------------------------- Health Logs & Vitals ----------------------------

app.get('/api/health/logs', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const list = Array.from(db.healthLogs.values())
    .filter((h) => h.circleId === cid)
    .sort((a, b) => b.ts - a.ts)
  res.json(list)
})

app.post('/api/health/logs', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const { mood, pain, sleepHours, notes, userId } = req.body || {}
  try {
    ensureCircleAccess(req.user!, cid)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const h: HealthLog = {
    id: id('hl'),
    circleId: cid,
    userId,
    ts: Date.now(),
    mood,
    pain,
    sleepHours,
    notes,
  }
  db.healthLogs.set(h.id, h)
  audit(req.user!.id, 'create', 'health_log', h.id)
  res.json(h)
})

app.get('/api/vitals', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const list = Array.from(db.vitals.values())
    .filter((v) => v.circleId === cid)
    .sort((a, b) => b.ts - a.ts)
  res.json(list)
})

app.post('/api/vitals', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const { kind, value, userId, aux } = req.body || {}
  if (!kind || value == null)
    return res.status(400).json({ error: 'kind and value required' })
  const v: Vital = {
    id: id('vt'),
    circleId: cid,
    kind,
    value: Number(value),
    userId,
    ts: Date.now(),
    aux,
  }
  db.vitals.set(v.id, v)
  audit(req.user!.id, 'create', 'vital', v.id, { kind, value })
  res.json(v)
})

app.post('/api/vitals/thresholds', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const { kind, min, max } = req.body || {}
  if (!kind) return res.status(400).json({ error: 'kind required' })
  const key = `${cid}:${kind}`
  db.thresholds.set(key, { circleId: cid, kind, min, max })
  audit(req.user!.id, 'update', 'threshold', key, { min, max })
  res.json({ ok: true })
})

// Reports
app.get('/api/reports/health', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const fmt = String(req.query.format || 'json')
  const from = Number(req.query.from || 0)
  const to = Number(req.query.to || Date.now())
  const logs = Array.from(db.healthLogs.values())
    .filter((h) => h.circleId === cid && h.ts >= from && h.ts <= to)
    .sort((a, b) => a.ts - b.ts)
  if (fmt === 'csv') {
    const rows = [
      'ts,userId,mood,pain,sleepHours,notes',
      ...logs.map((h) =>
        [
          h.ts,
          h.userId ?? '',
          h.mood ?? '',
          h.pain ?? '',
          h.sleepHours ?? '',
          JSON.stringify(h.notes ?? ''),
        ].join(','),
      ),
    ]
    res.setHeader('Content-Type', 'text/csv')
    return res.send(rows.join('\n'))
  }
  return res.json({ range: { from, to }, count: logs.length, logs })
})

// ---------------------------- Communication: Groups & Chat ----------------------------

app.post('/api/groups', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const { name, memberIds } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  const g: ChatRoom = {
    id: id('grp'),
    circleId: cid,
    name,
    memberIds: Array.isArray(memberIds) ? memberIds : [],
  }
  db.rooms.set(g.id, g)
  audit(req.user!.id, 'create', 'group', g.id)
  return res.json(g)
})

app.get('/api/chat/rooms', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const rooms = Array.from(db.rooms.values()).filter((r) => r.circleId === cid)
  res.json(rooms)
})

app.post('/api/chat/rooms', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const { name, memberIds } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  const r: ChatRoom = {
    id: id('rm'),
    circleId: cid,
    name,
    memberIds: Array.isArray(memberIds) ? memberIds : [],
  }
  db.rooms.set(r.id, r)
  audit(req.user!.id, 'create', 'room', r.id)
  return res.json(r)
})

app.get('/api/chat/messages', auth, (req: AuthedRequest, res) => {
  const roomId = String(req.query.roomId || '')
  if (!roomId) return res.status(400).json({ error: 'roomId required' })
  const msgs = Array.from(db.messages.values())
    .filter((m) => m.roomId === roomId)
    .sort((a, b) => a.ts - b.ts)
  res.json(msgs)
})

app.post('/api/chat/messages', auth, (req: AuthedRequest, res) => {
  const { roomId, text, fileId } = req.body || {}
  if (!roomId || (!text && !fileId))
    return res.status(400).json({ error: 'roomId and text/fileId required' })
  const r = db.rooms.get(roomId)
  if (!r) return res.status(404).json({ error: 'room not found' })
  try {
    ensureCircleAccess(req.user!, r.circleId)
  } catch {
    return res.status(403).json({ error: 'forbidden' })
  }
  const m: ChatMessage = {
    id: id('msg'),
    roomId,
    userId: req.user!.id,
    ts: Date.now(),
    text,
    fileId,
  }
  db.messages.set(m.id, m)
  audit(req.user!.id, 'create', 'message', m.id, { roomId })
  fanout(r.circleId, 'chat_message', `${req.user!.name}: ${text || '(file)'}`, {
    roomId,
    fileId,
  })
  res.json(m)
})

// ---------------------------- Emergency & Safety ----------------------------

app.post('/api/panic', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const { lat, lon, reason } = req.body || {}
  fanout(
    cid,
    'panic',
    i18nMessageForCircle(cid, 'panic', { reason, lat, lon }),
    { lat, lon, reason },
  )
  audit(req.user!.id, 'panic', 'circle', cid, { lat, lon, reason })
  res.json({ ok: true })
})

app.post('/api/heartbeat', auth, (req: AuthedRequest, res) => {
  const u = req.user!
  u.lastHeartbeatAt = Date.now()
  db.users.set(u.id, u)
  res.json({ ok: true, ts: u.lastHeartbeatAt })
})

app.post('/api/users/location', auth, (req: AuthedRequest, res) => {
  const u = req.user!
  const { lat, lon, country } = req.body || {}
  u.lastKnownLocation = { lat: Number(lat), lon: Number(lon), ts: Date.now() }
  if (country) {
    u.country = String(country).toUpperCase()
    const def = defaultLocaleByCountry[u.country]
    if (def && !u.language) u.language = def
  }
  db.users.set(u.id, u)
  audit(u.id, 'update', 'user_location', u.id, { lat, lon, country })
  res.json({ ok: true })
})

app.get('/api/geofences', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const list = Array.from(db.geofences.values()).filter(
    (g) => g.circleId === cid,
  )
  res.json(list)
})

app.post('/api/geofences', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id
  const { name, lat, lon, radiusM } = req.body || {}
  if (!name || lat == null || lon == null || radiusM == null)
    return res.status(400).json({ error: 'name, lat, lon, radiusM required' })
  const g: Geofence = {
    id: id('geo'),
    circleId: cid,
    name,
    lat: Number(lat),
    lon: Number(lon),
    radiusM: Number(radiusM),
  }
  db.geofences.set(g.id, g)
  audit(req.user!.id, 'create', 'geofence', g.id)
  res.json(g)
})

// ---------------------------- Features Teaser ----------------------------

app.get('/api/features/providers', auth, (req: AuthedRequest, res) =>
  res.json({
    status: 'coming_soon',
    integrations: ['LiveKit', 'Twilio Video', 'Jitsi', 'Epic/FHIR (Phase‑2)'],
  }),
)

// ---------------------------- Audits ----------------------------

app.get('/api/audits', auth, (req: AuthedRequest, res) => {
  const cid = req.user!.circleId || seedCircle.id // simple filter: show entries that reference this circle or actor is in circle
  const ids = new Set(
    Array.from(db.users.values())
      .filter((u) => db.members.has(memberKey(cid, u.id)))
      .map((u) => u.id),
  )
  const rows = db.audits
    .filter((a) => ids.has(a.actorId) || a.subjectId === cid)
    .slice(-500)
  res.json(rows)
})

// ---------------------------- Web Push/Disruptive Alert Contract ----------------------------
// Client should play a blocking sound/overlay on kind === 'disruptive_alert'

// ---------------------------- Reminder Scheduler ----------------------------

const TICK_MS = 60 * 1000 // 1 minute
setInterval(() => {
  const nowTs = Date.now()
  // Tasks: due‑aware reminders
  for (const tsk of db.tasks.values()) {
    if (tsk.completed) continue
    const intervalMs = (tsk.reminderIntervalMinutes || 0) * 60_000
    const dueSoonOrOverdue = tsk.due && nowTs >= tsk.due
    if (!intervalMs && !dueSoonOrOverdue) continue // nothing to do
    const shouldRemind =
      !tsk.__lastReminderAt ||
      nowTs - tsk.__lastReminderAt >= (intervalMs || 15 * 60_000) ||
      dueSoonOrOverdue
    if (shouldRemind) {
      tsk.__lastReminderAt = nowTs
      tsk.__reminderCount = (tsk.__reminderCount || 0) + 1
      db.tasks.set(tsk.id, tsk)
      fanout(
        tsk.circleId,
        'reminder',
        i18nMessageForCircle(tsk.circleId, 'reminder_task', {
          title: tsk.title,
        }),
      )
      if (tsk.__reminderCount >= 3)
        fanout(
          tsk.circleId,
          'escalation',
          i18nMessageForCircle(tsk.circleId, 'escalation', {
            title: tsk.title,
          }),
        )
      if (tsk.__reminderCount >= 5)
        fanout(
          tsk.circleId,
          'disruptive_alert',
          i18nMessageForCircle(tsk.circleId, 'disruptive_alert'),
        )
    }
  }
  // Events periodic reminders
  for (const ev of db.events.values()) {
    if (ev.completed || !ev.reminderIntervalMinutes) continue
    const intervalMs = ev.reminderIntervalMinutes * 60_000
    if (!ev.__lastReminderAt || nowTs - ev.__lastReminderAt >= intervalMs) {
      ev.__lastReminderAt = nowTs
      ev.__reminderCount = (ev.__reminderCount || 0) + 1
      db.events.set(ev.id, ev)
      fanout(
        ev.circleId,
        'reminder',
        i18nMessageForCircle(ev.circleId, 'reminder_event', {
          title: ev.title,
          when: ev.when,
        }),
      )
    }
  }
  // Vitals threshold checks (last 15m)
  const fifteen = 15 * 60_000
  for (const v of db.vitals.values()) {
    if (nowTs - v.ts > fifteen) continue
    const key = `${v.circleId}:${v.kind}`
    const th = db.thresholds.get(key)
    if (!th) continue
    if (
      (th.min != null && v.value < th.min) ||
      (th.max != null && v.value > th.max)
    ) {
      fanout(
        v.circleId,
        'vitals_alert',
        i18nMessageForCircle(v.circleId, 'vitals_alert', {
          kind: v.kind,
          value: v.value,
        }),
      )
    }
  }
  // Geofence checks
  for (const u of db.users.values()) {
    if (!u.circleId || !u.lastKnownLocation) continue
    const { lat, lon } = u.lastKnownLocation
    const fences = Array.from(db.geofences.values()).filter(
      (g) => g.circleId === u.circleId,
    )
    for (const g of fences) {
      const inFence = haversineM(lat, lon, g.lat, g.lon) <= g.radiusM
      const flagKey = `__in:${g.id}:${u.id}` as any
      ;(u as any)[flagKey] = (u as any)[flagKey] || false
      if (inFence && !(u as any)[flagKey]) {
        ;(u as any)[flagKey] = true
        fanout(
          u.circleId,
          'geofence_enter',
          i18nMessageForCircle(u.circleId, 'geofence_enter', { name: g.name }),
        )
      }
      if (!inFence && (u as any)[flagKey]) {
        ;(u as any)[flagKey] = false
        fanout(
          u.circleId,
          'geofence_exit',
          i18nMessageForCircle(u.circleId, 'geofence_exit', { name: g.name }),
        )
      }
    }
    db.users.set(u.id, u)
  }
  // Heartbeat inactivity (10 minutes)
  for (const u of db.users.values()) {
    if (!u.circleId || !u.lastHeartbeatAt) continue
    const mins = Math.round((nowTs - u.lastHeartbeatAt) / 60_000)
    if (mins >= 10)
      fanout(
        u.circleId,
        'inactivity',
        i18nMessageForCircle(u.circleId, 'inactivity', {
          name: u.name,
          min: mins,
        }),
      )
  }
}, TICK_MS)

function spawnNextIfRepeating(tsk: TaskItem) {
  if (!tsk.repeat || tsk.repeat === 'none') return
  const next: TaskItem = { ...tsk, id: id('tk'), completed: false }
  const day = 24 * 60 * 60 * 1000
  if (tsk.repeat === 'daily') {
    if (next.start) next.start += day
    if (next.due) next.due += day
  }
  if (tsk.repeat === 'weekly') {
    const wk = 7 * day
    if (next.start) next.start += wk
    if (next.due) next.due += wk
  }
  db.tasks.set(next.id, next)
}

function incReward(userId: string, pts: number) {
  const cur = db.rewards.get(userId) || 0
  db.rewards.set(userId, cur + pts)
}

function i18nMessageForCircle(circleId: string, key: string, params?: any) {
  const usersInCircle = Array.from(db.users.values()).filter((u) =>
    db.members.has(memberKey(circleId, u.id)),
  )
  const preferred =
    usersInCircle.find((u) => u.role === 'Owner') || usersInCircle[0]
  const lang = (preferred?.language || 'en') as Lang
  const fn = (i18n[lang] && i18n[lang][key]) || i18n.en[key]
  return fn ? fn(params) : `[${key}]`
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// ---------------------------- Start ----------------------------

app.listen(PORT, () => {
  console.log(`${VERSION} listening on http://127.0.0.1:${PORT}`)
})
