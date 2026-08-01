export type QueryConfig = {
  text: string;
  values: any[];
};

export interface DisplayFile {
  artist: string | null;
  nsfw: boolean;
  path: string;
}

export interface ScanOptions {
  concurrency: number;
  retries: number;
  retryMs: number;
}

export interface FileFingerprint {
  size: number;
  mtimeMs: number;
  hash: string;
}

export interface FingerprintUpdate {
  path: string;
  size: number;
  mtimeMs: number;
  hash: string;
}
