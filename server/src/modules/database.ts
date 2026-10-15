import { Pool, QueryResult } from "pg";
import {
  DisplayFile,
  DisplayFileSummary,
  ImageServeSummary,
  MetadataRow,
  QueryConfig,
  ScanRunSummary,
} from "../models/types";
import { logMessage } from "./util";
import { stripScannerPathPrefix } from "./util";

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
    logMessage(`Unexpected error on idle client: ${err.message}`, "error");
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
    const result = await dbContext.pool.query(query);
    if (result.rowCount === 0) return undefined;
    return result;
  }
}

export async function initDbTables() {
  await execQuery(
    "CREATE TABLE IF NOT EXISTS display_files (\
    path        TEXT PRIMARY KEY,\
    artist      TEXT,\
    nsfw        BOOLEAN,\
    id          UUID\
);",
  );
  await execQuery(
    "CREATE TABLE IF NOT EXISTS metadata (\
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),\
    name      TEXT UNIQUE,\
    value     TEXT\
    );",
  );

  await execQuery(
    "CREATE TABLE IF NOT EXISTS xmp_fingerprints (\
    path      TEXT PRIMARY KEY,\
    size      BIGINT NOT NULL,\
    mtime_ms  DOUBLE PRECISION NOT NULL,\
    hash      TEXT NOT NULL,\
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\
);",
  );

  await execQuery(
    "CREATE TABLE IF NOT EXISTS scan_runs (\
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\
    started_at timestamptz NOT NULL DEFAULT now(),\
    finished_at timestamptz,\
    scanned bigint NOT NULL DEFAULT 0,\
    processed bigint NOT NULL DEFAULT 0,\
    fingerprints_updated bigint NOT NULL DEFAULT 0,\
    display_inserted bigint NOT NULL DEFAULT 0,\
    display_deleted bigint NOT NULL DEFAULT 0,\
    errors bigint NOT NULL DEFAULT 0,\
    nsfw_hits bigint NOT NULL DEFAULT 0,\
    sfw_hits bigint NOT NULL DEFAULT 0,\
    duration_ms bigint,\
    metadata jsonb\
);",
  );
  await execQuery(
    "CREATE TABLE IF NOT EXISTS image_serve_events (\
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\
    served_at timestamptz NOT NULL DEFAULT now(),\
    file_id uuid NOT NULL,\
    file_path text NOT NULL,\
    artist text,\
    rating text NOT NULL CHECK (rating IN ('sfw', 'nsfw'))\
);",
  );
  await execQuery(
    "CREATE INDEX IF NOT EXISTS idx_image_serve_events_served_at ON image_serve_events (served_at DESC);",
  );
  await execQuery(
    "CREATE INDEX IF NOT EXISTS idx_image_serve_events_rating_served_at ON image_serve_events (rating, served_at DESC);",
  );
  await execQuery(
    "CREATE INDEX IF NOT EXISTS idx_image_serve_events_file_id ON image_serve_events (file_id);",
  );
  await execQuery(
    "CREATE INDEX IF NOT EXISTS idx_image_serve_events_artist ON image_serve_events (artist);",
  );
  await execQuery(
    "COMMENT ON TABLE image_serve_events IS 'Historical image serve events for /img/random. artist is intentionally a snapshot captured at serve time and is not a live lookup into display_files.';",
  );
  await execQuery(
    "INSERT INTO metadata (name, value)\
    VALUES ('currentRating', 'sfw') \
    ON CONFLICT (name) DO NOTHING;");
}
export async function getRandomDisplayFile(
  rating: "all" | string = "all",
): Promise<DisplayFile> {
  let query = "SELECT * FROM display_files ";

  switch (rating) {
    case "sfw":
      query += "WHERE nsfw=$1";
      break;
    case "nsfw":
      query += "WHERE nsfw=$1";
      break;

    default:
      break;
  }
  query += " ORDER BY RANDOM() LIMIT 1;";
  const queryConfig: QueryConfig = {
    text: query,
    values: [],
  };
  if (rating !== "all") {
    queryConfig.values = [rating === "nsfw" ? true : false];
  }
  let round = 1;
  let result: QueryResult | undefined;
  do {
    result = await execQuery(queryConfig);
    if (result?.rowCount === 0 || !result) {
      round += 1;
      logMessage(
        `getRandomDisplayFile(): Row was undefined, starting round ${round}.`,
        "warn",
      );
      continue;
    }
    break;
  } while (1);
  return result?.rows[0];
}

export async function getDisplayFileById(
  id: string,
): Promise<DisplayFile | undefined> {
  const query = {
    text: "SELECT * FROM display_files WHERE id=$1",
    values: [id],
  };
  const result = await execQuery(query);
  if (!result) return undefined;
  return result.rows[0];
}

export async function getMetadataValue(
  name: string,
): Promise<MetadataRow | undefined> {
  const query = {
    text: "SELECT id, name, value FROM metadata WHERE name=$1",
    values: [name],
  };
  const result = await execQuery(query);
  if (!result) return undefined;
  return result.rows[0];
}

export async function allMetadataValues(): Promise<MetadataRow[]> {
  const query = {
    text: "SELECT id, name, value FROM metadata",
  };
  const result = await execQuery(query);
  if (!result) return [];
  return result.rows;
}

export async function getDisplayFileSummary(): Promise<DisplayFileSummary> {
  const summaryQuery = {
    text: `
      WITH artist_counts AS (
        SELECT
          artist,
          COUNT(*) AS total_files,
          COUNT(*) FILTER (WHERE nsfw = true) AS nsfw_files,
          COUNT(*) FILTER (WHERE nsfw = false) AS sfw_files
        FROM display_files
        WHERE artist IS NOT NULL
        GROUP BY artist
      )
      SELECT
        COUNT(*) AS total_files,
        COUNT(*) FILTER (WHERE nsfw = true) AS nsfw_files,
        COUNT(*) FILTER (WHERE nsfw = false) AS sfw_files,
        COUNT(DISTINCT artist) AS total_artists,
        ROUND(CAST(100.0 * COUNT(*) FILTER (WHERE nsfw = false) / NULLIF(COUNT(*), 0) AS numeric), 2) AS sfw_pct,
        ROUND(CAST(100.0 * COUNT(*) FILTER (WHERE nsfw = true) / NULLIF(COUNT(*), 0) AS numeric), 2) AS nsfw_pct,
        COALESCE((SELECT ROUND(CAST(AVG(total_files) AS numeric), 2) FROM artist_counts), 0) AS avg_files_per_artist,
        COALESCE((SELECT ROUND(CAST(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_files) AS numeric), 2) FROM artist_counts), 0) AS median_files_per_artist,
        COALESCE((SELECT ROUND((CAST(MAX(total_files) AS numeric) / NULLIF(AVG(total_files), 0)), 2) FROM artist_counts), 0) AS concentration_ratio
      FROM display_files
    `,
  };

  const topArtistsQuery = {
    text: `
      SELECT
        artist,
        COUNT(*) AS total_files,
        COUNT(*) FILTER (WHERE nsfw = true) AS nsfw_files,
        COUNT(*) FILTER (WHERE nsfw = false) AS sfw_files,
        ROUND(CAST(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM display_files), 0) AS numeric), 2) AS share_pct
      FROM display_files
      WHERE artist IS NOT NULL
      GROUP BY artist
      ORDER BY total_files DESC, artist ASC
      LIMIT 10
    `,
  };

  const [summaryResult, topArtistsResult] = await Promise.all([
    execQuery(summaryQuery),
    execQuery(topArtistsQuery),
  ]);

  const summaryRow = summaryResult?.rows[0] ?? {
    total_files: 0,
    total_artists: 0,
    sfw_files: 0,
    nsfw_files: 0,
    sfw_pct: 0,
    nsfw_pct: 0,
    avg_files_per_artist: 0,
    median_files_per_artist: 0,
    concentration_ratio: 0,
  };

  return {
    total_files: Number(summaryRow.total_files ?? 0),
    total_artists: Number(summaryRow.total_artists ?? 0),
    sfw_files: Number(summaryRow.sfw_files ?? 0),
    nsfw_files: Number(summaryRow.nsfw_files ?? 0),
    sfw_pct: Number(summaryRow.sfw_pct ?? 0),
    nsfw_pct: Number(summaryRow.nsfw_pct ?? 0),
    avg_files_per_artist: Number(summaryRow.avg_files_per_artist ?? 0),
    median_files_per_artist: Number(summaryRow.median_files_per_artist ?? 0),
    concentration_ratio: Number(summaryRow.concentration_ratio ?? 0),
    top_artists: topArtistsResult?.rows ?? [],
    artist_breakdown: topArtistsResult?.rows ?? [],
  };
}

export async function getScanRunHistory(
  since?: Date | string,
): Promise<ScanRunSummary[]> {
  const cutoff = since
    ? new Date(since)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(cutoff.getTime())) {
    throw new Error("Invalid scan history time window.");
  }

  const query = {
    text: `
      SELECT
        id,
        started_at,
        finished_at,
        scanned,
        processed,
        fingerprints_updated,
        display_inserted,
        display_deleted,
        errors,
        nsfw_hits,
        sfw_hits,
        duration_ms,
        metadata
      FROM scan_runs
      WHERE started_at >= $1
      ORDER BY started_at DESC
    `,
    values: [cutoff.toISOString()],
  };

  const result = await execQuery(query);
  if (!result) return [];
  return result.rows as ScanRunSummary[];
}

export async function recordImageServeEvent(
  fileId: string,
  filePath: string,
  artist: string | null,
  rating: "sfw" | "nsfw",
) {
  const query = {
    text: `
      INSERT INTO image_serve_events (file_id, file_path, artist, rating)
      VALUES ($1, $2, $3, $4)
    `,
    values: [fileId, filePath, artist, rating],
  };

  return execQuery(query, "transaction");
}

export async function getImageServeSummary(
  since?: Date | string,
): Promise<ImageServeSummary> {
  const cutoff = since
    ? new Date(since)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(cutoff.getTime())) {
    throw new Error("Invalid image serve statistics time window.");
  }

  const summaryQuery = {
    text: `
      SELECT
        COUNT(*) AS total_serves,
        COUNT(*) FILTER (WHERE rating = 'sfw') AS sfw_serves,
        COUNT(*) FILTER (WHERE rating = 'nsfw') AS nsfw_serves,
        ROUND(100.0 * COUNT(*) FILTER (WHERE rating = 'sfw') / NULLIF(COUNT(*), 0), 2) AS sfw_pct,
        ROUND(100.0 * COUNT(*) FILTER (WHERE rating = 'nsfw') / NULLIF(COUNT(*), 0), 2) AS nsfw_pct
      FROM image_serve_events
      WHERE served_at >= $1
    `,
    values: [cutoff.toISOString()],
  };

  const topFilesQuery = {
    text: `
      SELECT
        file_id,
        file_path,
        COUNT(*) AS serves,
        COUNT(*) FILTER (WHERE rating = 'sfw') AS sfw_serves,
        COUNT(*) FILTER (WHERE rating = 'nsfw') AS nsfw_serves
      FROM image_serve_events
      WHERE served_at >= $1
      GROUP BY file_id, file_path
      ORDER BY serves DESC, file_path ASC
      LIMIT 10
    `,
    values: [cutoff.toISOString()],
  };

  const topArtistsQuery = {
    text: `
      SELECT
        artist,
        COUNT(*) AS serves,
        COUNT(*) FILTER (WHERE rating = 'sfw') AS sfw_serves,
        COUNT(*) FILTER (WHERE rating = 'nsfw') AS nsfw_serves
      FROM image_serve_events
      WHERE served_at >= $1
        AND artist IS NOT NULL
      GROUP BY artist
      ORDER BY serves DESC, artist ASC
      LIMIT 10
    `,
    values: [cutoff.toISOString()],
  };

  const artistBreakdownQuery = {
    text: `
      SELECT
        artist,
        COUNT(*) FILTER (WHERE rating = 'sfw') AS sfw_serves,
        COUNT(*) FILTER (WHERE rating = 'nsfw') AS nsfw_serves,
        COUNT(*) AS serves
      FROM image_serve_events
      WHERE served_at >= $1
        AND artist IS NOT NULL
      GROUP BY artist
      ORDER BY serves DESC, artist ASC
    `,
    values: [cutoff.toISOString()],
  };

  const [summaryResult, topFilesResult, topArtistsResult, artistBreakdownResult] =
    await Promise.all([
      execQuery(summaryQuery),
      execQuery(topFilesQuery),
      execQuery(topArtistsQuery),
      execQuery(artistBreakdownQuery),
    ]);

  const summaryRow = summaryResult?.rows[0] ?? {
    total_serves: 0,
    sfw_serves: 0,
    nsfw_serves: 0,
    sfw_pct: 0,
    nsfw_pct: 0,
  };

  const topFiles = (topFilesResult?.rows ?? []).map((row) => ({
    ...row,
    file_path: stripScannerPathPrefix(row.file_path),
  }));

  return {
    total_serves: Number(summaryRow.total_serves ?? 0),
    sfw_serves: Number(summaryRow.sfw_serves ?? 0),
    nsfw_serves: Number(summaryRow.nsfw_serves ?? 0),
    sfw_pct: Number(summaryRow.sfw_pct ?? 0),
    nsfw_pct: Number(summaryRow.nsfw_pct ?? 0),
    top_files: topFiles,
    top_artists: topArtistsResult?.rows ?? [],
    artist_breakdown: artistBreakdownResult?.rows ?? [],
  };
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
  T extends { value: any },
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
