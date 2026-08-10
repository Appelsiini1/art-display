import { Pool, QueryResult } from "pg";
import { DisplayFile, MetadataRow, QueryConfig } from "../models/types";
import { logMessage } from "./util";

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
    name      TEXT,\
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
