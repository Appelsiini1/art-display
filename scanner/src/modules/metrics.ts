import { execQuery } from "./db";
import { logMessage } from "./util";

type Counters = Record<string, number>;

let runId: string | null = null;
let startedAt: number | null = null;
let counters: Counters = {};
let metadata: Record<string, any> | null = null;

export function startRun(meta?: Record<string, any>): string|null {
  reset();
  // Use crypto.randomUUID if available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const id = (globalThis as any).crypto?.randomUUID?.() ?? require("crypto").randomUUID();
  runId = id;
  startedAt = Date.now();
  metadata = meta ?? null;
  logMessage(`Metrics: started run ${runId}`, "info");
  return runId;
}

export function inc(key: string, delta = 1) {
  if (!counters[key]) counters[key] = 0;
  counters[key] += delta;
}

export function getCounters(): Counters {
  return { ...counters };
}

export function reset() {
  runId = null;
  startedAt = null;
  counters = {};
  metadata = null;
}

export async function finishAndPersist(): Promise<void> {
  if (!runId || !startedAt) {
    logMessage("Metrics: no active run to persist", "warn");
    return;
  }
  const finishedAt = Date.now();
  const durationMs = finishedAt - startedAt;

  const values = [
    runId,
    new Date(startedAt).toISOString(),
    new Date(finishedAt).toISOString(),
    counters.scanned ?? 0,
    counters.processed ?? 0,
    counters.fingerprints_updated ?? 0,
    counters.display_inserted ?? 0,
    counters.display_deleted ?? 0,
    counters.errors ?? 0,
    counters.nsfw_hits ?? 0,
    counters.sfw_hits ?? 0,
    durationMs,
    metadata ? JSON.stringify(metadata) : null,
  ];

  const query = {
    text: `INSERT INTO scan_runs (id, started_at, finished_at, scanned, processed, fingerprints_updated, display_inserted, display_deleted, errors, nsfw_hits, sfw_hits, duration_ms, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    values,
  };

  try {
    await execQuery(query);
    logMessage(`Metrics: persisted run ${runId}`, "info");
  } catch (err: any) {
    logMessage(`Metrics: failed to persist run ${runId}: ${err && err.message ? err.message : err}`, "error");
  } finally {
    reset();
  }
}

export default { startRun, inc, getCounters, finishAndPersist, reset };
