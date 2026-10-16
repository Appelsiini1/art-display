import { ImageServeSummary, ScanRunSummary } from "../../models/types";
import { stripScannerPathPrefix } from "../util";
import { execQuery } from "./connection";

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

  const latestServedQuery = {
    text: `
      SELECT
        file_id,
        file_path,
        artist,
        rating,
        served_at
      FROM image_serve_events
      ORDER BY served_at DESC
      LIMIT 10
    `,
    values: [],
  };

  const [
    summaryResult,
    topFilesResult,
    topArtistsResult,
    artistBreakdownResult,
    latestServedResult,
  ] = await Promise.all([
    execQuery(summaryQuery),
    execQuery(topFilesQuery),
    execQuery(topArtistsQuery),
    execQuery(artistBreakdownQuery),
    execQuery(latestServedQuery),
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

  const latestServed = (latestServedResult?.rows ?? []).map((row) => ({
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
    latest_served: latestServed,
  };
}
