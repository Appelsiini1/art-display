import { Pool } from "pg";
import {
  DisplayFile,
  FileFingerprint,
  FingerprintUpdate,
} from "../models/types";
import { setInterval } from "node:timers";
import { logMessage, stripXmpExtension } from "./util";

const dbContext: { pool: null | Pool } = {
  pool: null,
};

export function initDbPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // the pool will emit an error on behalf of any idle clients
  // it contains if a backend error or network partition happens
  pool.on("error", (err, client) => {
    logMessage(`Unexpected error on idle client ${err.message}`, "error");
    process.exit(-1);
  });
  dbContext.pool = pool;
}

export async function execQuery(
  query: { text: string; values?: any[] } | string,
  queryType: "query" | "transaction" = "query",
) {
  if (!dbContext.pool) {
    initDbPool();
  }
  if (queryType === "transaction") {
    const client = await dbContext.pool?.connect();
    try {
      await client?.query("BEGIN");
      await client?.query(query);
      await client?.query("COMMIT");
    } catch (err: any) {
      await client?.query("ROLLBACK");
      throw err;
    } finally {
      client?.release();
    }
  } else {
    // @ts-ignore
    return await dbContext.pool.query(query);
  }
}

export async function getCachedFingerprint(
  filePath: string,
): Promise<FileFingerprint | null> {
  const result = await execQuery({
    text: `SELECT size, mtime_ms AS "mtimeMs", hash FROM xmp_fingerprints WHERE path = $1`,
    values: [filePath],
  });
  if (result?.rowCount === 0) return null;
  return result?.rows[0] ?? null;
}

class FingerprintBatchWriter {
  private buffer: FingerprintUpdate[] = [];
  private flushing: Promise<void> | null = null;

  constructor(
    private batchSize = 500,
    private flushIntervalMs = 2000,
  ) {
    // safety net: flush periodically even if batchSize is never hit
    setInterval(
      () =>
        this.flush().catch((err) => {
          logMessage(
            `Fingerprint batch flush error: ${err.message}\n`,
            "error",
          );
        }),
      flushIntervalMs,
    ).unref();
  }

  async add(update: FingerprintUpdate): Promise<void> {
    this.buffer.push(update);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    // avoid overlapping flushes if multiple callers trigger it at once
    if (this.flushing) return this.flushing;

    if (this.buffer.length === 0) return;

    const batch = this.buffer;
    this.buffer = [];

    this.flushing = this.writeBatch(batch).finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async writeBatch(batch: FingerprintUpdate[]): Promise<void> {
    if (batch.length === 0) return;
    const paths = batch.map((b) => b.path);
    const sizes = batch.map((b) => b.size);
    const mtimes = batch.map((b) => b.mtimeMs);
    const hashes = batch.map((b) => b.hash);

    await execQuery({
      text: `INSERT INTO xmp_fingerprints (path, size, mtime_ms, hash, updated_at)
       SELECT * , now()
       FROM UNNEST($1::text[], $2::bigint[], $3::double precision[], $4::text[])
       AS t(path, size, mtime_ms, hash)
       ON CONFLICT (path) DO UPDATE
         SET size = EXCLUDED.size, mtime_ms = EXCLUDED.mtime_ms, hash = EXCLUDED.hash, updated_at = now()`,
      values: [paths, sizes, mtimes, hashes],
    });
  }

  // call this once at the very end, after processFilesConcurrently resolves
  async close(): Promise<void> {
    await this.flush();
  }
}

export const fingerprintWriter = new FingerprintBatchWriter();

class DisplayFileBatchWriter {
  private buffer: DisplayFile[] = [];
  private flushing: Promise<void> | null = null;

  constructor(
    private batchSize = 500,
    private flushIntervalMs = 2000,
  ) {
    // safety net: flush periodically even if batchSize is never hit
    setInterval(
      () =>
        this.flush().catch((err) => {
          logMessage(
            `Fingerprint batch flush error: ${err.message}\n`,
            "error",
          );
        }),
      flushIntervalMs,
    ).unref();
  }

  async add(update: DisplayFile): Promise<void> {
    this.buffer.push(update);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    // avoid overlapping flushes if multiple callers trigger it at once
    if (this.flushing) return this.flushing;

    if (this.buffer.length === 0) return;

    const batch = this.buffer;
    this.buffer = [];

    this.flushing = this.writeBatch(batch).finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async writeBatch(batch: DisplayFile[]): Promise<void> {
    if (batch.length === 0) return;
    const paths = batch.map((b) => b.path);
    const artists = batch.map((b) => b.artist);
    const nsfws = batch.map((b) => b.nsfw);

    await execQuery({
      text: `INSERT INTO display_files (path, artist, nsfw, id)
       SELECT *, gen_random_uuid()
       FROM UNNEST($1::text[], $2::text[], $3::boolean[])
       AS t(path, artist, nsfw)
       ON CONFLICT (path) DO UPDATE
         SET artist = EXCLUDED.artist, nsfw = EXCLUDED.nsfw`,
      values: [paths, artists, nsfws],
    });
  }

  // call this once at the very end
  async close(): Promise<void> {
    await this.flush();
  }
}

export const displayFileBatchWriter = new DisplayFileBatchWriter();

class DisplayFileDeleteWriter {
  private buffer: string[] = [];
  private flushing: Promise<void> | null = null;

  constructor(
    private batchSize = 500,
    private flushIntervalMs = 2000,
  ) {
    setInterval(
      () =>
        this.flush().catch((err) => {
          logMessage(
            `Display file delete batch flush error: ${err.message}\n`,
            "error",
          );
        }),
      flushIntervalMs,
    ).unref();
  }

  async add(path: string): Promise<void> {
    this.buffer.push(path);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    if (this.buffer.length === 0) return;

    const batch = this.buffer;
    this.buffer = [];

    this.flushing = this.writeBatch(batch).finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  private async writeBatch(batch: string[]): Promise<void> {
    if (batch.length === 0) return;
    await execQuery({
      text: `DELETE FROM display_files WHERE path = ANY($1::text[])`,
      values: [batch],
    });
  }

  async close(): Promise<void> {
    await this.flush();
  }
}

export const displayFileDeleteWriter = new DisplayFileDeleteWriter();

export async function selectAllFingerprintPaths(): Promise<string[]> {
  const result = await execQuery(`SELECT path FROM xmp_fingerprints`);
  return result?.rows.map((r: { path: string }) => r.path) ?? [];
}

export async function deleteStaleFingerprintsAndDisplayFiles(
  staleXmpPaths: string[],
): Promise<{ fingerprints: number; displayFiles: number }> {
  if (staleXmpPaths.length === 0) {
    return { fingerprints: 0, displayFiles: 0 };
  }
  const strippedPaths = staleXmpPaths.map(stripXmpExtension);

  const fpResult = await execQuery({
    text: `DELETE FROM xmp_fingerprints WHERE path = ANY($1::text[])`,
    values: [staleXmpPaths],
  });
  const dfResult = await execQuery({
    text: `DELETE FROM display_files WHERE path = ANY($1::text[])`,
    values: [strippedPaths],
  });

  return {
    fingerprints: fpResult?.rowCount ?? 0,
    displayFiles: dfResult?.rowCount ?? 0,
  };
}
