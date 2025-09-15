// src/lib/routes.ts
export const R = {
  admin: "/admin",
  calendar: "/admin?tab=calendar",
  tasks: "/admin?tab=tasks",
  meds: "/admin?tab=meds",
  health: "/admin?tab=health",
  healthDiabetes: "/admin?tab=health&view=diabetes",
  healthReports: "/admin?tab=health&view=reports",
  vault: "/admin?tab=vault",
  chat: "/admin?tab=chat",
  devices: "/admin?tab=devices",
  enforce: "/admin?tab=enforce",
  map: "/admin?tab=geofences",
  receipts: "/admin?tab=household&view=receipts",
  pricing: "/pricing",
  livestream: "/admin?tab=chat&view=live",
};
export type RouteKey = keyof typeof R;
