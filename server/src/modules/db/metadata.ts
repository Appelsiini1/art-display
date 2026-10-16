import { execQuery } from "./connection";
import { MetadataRow, QueryConfig } from "../../models/types";

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

export async function insertRow<T extends Record<string, any>>(
  table: string,
  data: T,
  options?: { returning?: boolean },
) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  const columns = entries.map(([key]) => key);
  const values = entries.map(([, value]) => value);
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

  const setClauses = dataEntries.map(([key], i) => `${key} = $${i + 1}`);
  const values: any[] = [];

  for (const [, value] of dataEntries) {
    values.push(value);
  }

  const whereClauses = whereEntries.map(
    ([key], i) => `${key} = $${dataEntries.length + i + 1}`,
  );

  for (const [, value] of whereEntries) {
    values.push(value);
  }

  let returningClause = "";
  if (options?.returning) {
    const updatedFields = dataEntries.map(([key]) => key);
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
