export interface DisplayFile {
  artist: string | null;
  nsfw: boolean;
  path: string;
  id: string;
}

export interface MetadataRow {
  name: string;
  value: string;
  id: string;
}

export interface ScanRunSummary {
  id: string;
  started_at: string;
  finished_at: string | null;
  scanned: number;
  processed: number;
  fingerprints_updated: number;
  display_inserted: number;
  display_deleted: number;
  errors: number;
  nsfw_hits: number;
  sfw_hits: number;
  duration_ms: number | null;
  metadata: Record<string, any> | null;
}

export interface ImageServeEvent {
  id: string;
  served_at: string;
  file_id: string;
  file_path: string;
  artist: string | null;
  rating: "sfw" | "nsfw";
}

export interface TopFileStat {
  file_id: string;
  file_path: string;
  serves: number;
  sfw_serves: number;
  nsfw_serves: number;
}

export interface TopArtistStat {
  artist: string | null;
  serves: number;
  sfw_serves: number;
  nsfw_serves: number;
}

export interface ImageServeSummary {
  total_serves: number;
  sfw_serves: number;
  nsfw_serves: number;
  sfw_pct: number;
  nsfw_pct: number;
  top_files: TopFileStat[];
  top_artists: TopArtistStat[];
  artist_breakdown: TopArtistStat[];
}

export type QueryConfig = {
  text: string;
  values: any[];
};

export interface DisplayFileDTO extends DisplayFile {
  file: string;
}
