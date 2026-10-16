import { Pool } from "pg";
import { logMessage } from "../util";

const dbContext: { pool: null | Pool } = {
  pool: null,
};

export function getDbPool(): Pool | null {
  return dbContext.pool;
}

export function initDbPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  pool.on("error", (err) => {
    logMessage(`Unexpected error on idle client: ${err.message}`, "error");
    process.exit(-1);
  });

  dbContext.pool = pool;
  return pool;
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
