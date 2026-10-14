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

export type QueryConfig = {
  text: string;
  values: any[];
};

export interface DisplayFileDTO extends DisplayFile {
  file: string;
}
