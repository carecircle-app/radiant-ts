// src/lib/customerLookup.ts
import { promises as fs } from "node:fs";
import path from "node:path";

type SubRecord = {
  id: string;
  status: string;
  customer: string | null;
  updated_at: number;
};

type InvoiceRecord = {
  id: string;
  customer?: string | null;
  created?: number;
  updated_at: number;
};

async function readJson<T = Record<string, any>>(rel: string): Promise<T> {
  try {
    const p = path.join(process.cwd(), "data", rel);
    const raw = await fs.readFile(p, "utf8");
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

/**
 * Find the most recently updated customer id from our local json stores.
 * Prefers subscriptions (active customers), falling back to latest invoice.
 */
export async function findRecentCustomerId(): Promise<string | null> {
  const subs = await readJson<Record<string, SubRecord>>("stripe-subscriptions.json");
  const invs = await readJson<Record<string, InvoiceRecord>>("stripe-invoices.json");

  const subList = Object.values(subs)
    .filter((s) => !!s.customer)
    .sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0));

  if (subList.length && subList[0].customer) {
    return subList[0].customer;
  }

  const invList = Object.values(invs)
    .filter((i) => !!i.customer)
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0));

  if (invList.length && invList[0].customer) {
    return invList[0].customer!;
  }

  return null;
}
