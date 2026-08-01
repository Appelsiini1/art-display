import { Pool } from "pg";
import {
  DisplayFile,
  FileFingerprint,
  FingerprintUpdate,
  QueryConfig,
} from "../models/types";
import { setInterval } from "node:timers";

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
    console.error("Unexpected error on idle client", err);
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

export async function insertRow<T extends Record<string, any>>(
  table: string,
  data: T,
  options?: { returning?: boolean },
) {
  // Remove undefined values
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);

  const columns = entries.map(([key]) => key);

  const values = entries.map(([, value]) => {
    return value;
  });

  const placeholders = entries.map((_, i) => `$${i + 1}`);

  const query: QueryConfig = {
    text: `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      ${options?.returning ? "RETURNING *" : ""}
    `,
    values,
  };

  return execQuery(query, "transaction");
}

export async function updateRow<
  T extends { id: any },
  W extends Record<string, any>,
>(
  table: string,
  data: Partial<T>,
  where: W,
  options?: { returning?: boolean },
) {
  const dataEntries = Object.entries(data).filter(([, v]) => v !== undefined);

  if (dataEntries.length === 0) {
    throw new Error("No fields provided for update");
  }

  const whereEntries = Object.entries(where);

  if (whereEntries.length === 0) {
    throw new Error("WHERE clause is required to prevent full-table updates");
  }

  // Build SET clause
  const setClauses = dataEntries.map(([key], i) => `${key} = $${i + 1}`);

  const values: any[] = [];

  // Add SET values
  for (const [, value] of dataEntries) {
    values.push(value);
  }

  // Build WHERE clause
  const whereClauses = whereEntries.map(
    ([key], i) => `${key} = $${dataEntries.length + i + 1}`,
  );

  // Add WHERE values
  for (const [, value] of whereEntries) {
    values.push(value);
  }

  // Build RETURNING clause (only updated fields + id)
  let returningClause = "";
  if (options?.returning) {
    const updatedFields = dataEntries.map(([key]) => key);

    // Ensure id is included (avoid duplicates)
    const returningFields = Array.from(new Set(["id", ...updatedFields]));

    returningClause = `RETURNING ${returningFields.join(", ")}`;
  }

  const query: QueryConfig = {
    text: `
      UPDATE ${table}
      SET ${setClauses.join(", ")}
      WHERE ${whereClauses.join(" AND ")}
      ${returningClause}
    `,
    values,
  };

  return execQuery(query, "transaction");
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
          process.stderr.write(
            `Fingerprint batch flush error: ${err.message}\n`,
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
          process.stderr.write(
            `Fingerprint batch flush error: ${err.message}\n`,
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
