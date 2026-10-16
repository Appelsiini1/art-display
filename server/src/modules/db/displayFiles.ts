import { QueryResult } from "pg";
import { DisplayFile, DisplayFileSummary, QueryConfig } from "../../models/types";
import { execQuery } from "./connection";

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

  const topNsfwArtistsQuery = {
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
        artist,
        total_files,
        sfw_files,
        nsfw_files,
        ROUND(CAST(100.0 * nsfw_files / NULLIF(total_files, 0) AS numeric), 2) AS share_pct
      FROM artist_counts
      ORDER BY share_pct DESC, total_files DESC, artist ASC
      LIMIT 5
    `,
  };

  const topSfwArtistsQuery = {
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
        artist,
        total_files,
        sfw_files,
        nsfw_files,
        ROUND(CAST(100.0 * sfw_files / NULLIF(total_files, 0) AS numeric), 2) AS share_pct
      FROM artist_counts
      ORDER BY share_pct DESC, total_files DESC, artist ASC
      LIMIT 5
    `,
  };

  const top10ShareQuery = {
    text: `
      WITH artist_counts AS (
        SELECT
          artist,
          COUNT(*) AS total_files
        FROM display_files
        WHERE artist IS NOT NULL
        GROUP BY artist
      ),
      top_10_artists AS (
        SELECT total_files
        FROM artist_counts
        ORDER BY total_files DESC, artist ASC
        LIMIT 10
      )
      SELECT
        ROUND(
          CAST(
            100.0 * COALESCE((SELECT SUM(total_files) FROM top_10_artists), 0) / NULLIF((SELECT COUNT(*) FROM display_files), 0) AS numeric
          ),
          2
        ) AS top_10_artists_share_pct
    `,
  };

  const [summaryResult, topArtistsResult, topNsfwArtistsResult, topSfwArtistsResult, top10ShareResult] = await Promise.all([
    execQuery(summaryQuery),
    execQuery(topArtistsQuery),
    execQuery(topNsfwArtistsQuery),
    execQuery(topSfwArtistsQuery),
    execQuery(top10ShareQuery),
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
    top_10_artists_share_pct: Number(top10ShareResult?.rows[0]?.top_10_artists_share_pct ?? 0),
    top_artists: topArtistsResult?.rows ?? [],
    top_nsfw_artists: topNsfwArtistsResult?.rows ?? [],
    top_sfw_artists: topSfwArtistsResult?.rows ?? [],
    artist_breakdown: topArtistsResult?.rows ?? [],
  };
}
