// src/lib/eventStore.ts
import { promises as fs } from "fs";
import path from "path";

/**
 * Simple durable event store for dev/small scale.
 * Writes JSONL rows: "<id>\t<type>\t<ts>\n" into ./.data/stripe_events.jsonl
 *
 * We’ll later swap this to Postgres with the same API (seenOncePersist).
 */

const DATA_DIR = path.resolve(process.cwd(), ".data");
const FILE = process.env.EVENT_STORE_FILE
  ? path.resolve(process.cwd(), process.env.EVENT_STORE_FILE)
  : path.join(DATA_DIR, "stripe_events.jsonl");

// In-memory cache so we don't re-read file every time
const cache = new Set<string>();
let ready: Promise<void> | null = null;

async function init() {
  // Ensure folder exists
  await fs.mkdir(path.dirname(FILE), { recursive: true });

  // Warm cache from existing file (if present)
  try {
    const text = await fs.readFile(FILE, "utf8");
    for (const line of text.split("\n")) {
      const id = line.split("\t")[0]?.trim();
      if (id) cache.add(id);
    }
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      // Create empty file on first run
      await fs.writeFile(FILE, "", "utf8");
    } else {
      throw e;
    }
  }
}

function ensure() {
  if (!ready) ready = init();
  return ready;
}

/**
 * Returns true if we've seen this event before, false if first time.
 * Persists first-time events to disk and caches in-memory for speed.
 */
export async function seenOncePersist(
  id: string,
  type?: string
): Promise<boolean> {
  await ensure();
  if (!id) return false; // don't dedup empty ids

  if (cache.has(id)) return true;

  const line = `${id}\t${type ?? ""}\t${Date.now()}\n`;
  await fs.appendFile(FILE, line, "utf8");
  cache.add(id);
  return false;
}
