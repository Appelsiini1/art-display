export interface DisplayFile {
  id: string;
  artist: string | null;
  nsfw: boolean;
  path: string;
  created_at: Date;
  updated_at: Date;
}

export interface MetadataRow {
  name: string;
  value: string;
}

export type QueryConfig = {
  text: string;
  values: any[];
};

export interface DisplayFileDTO extends DisplayFile {
  file: string;
}
