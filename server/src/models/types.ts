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

export type QueryConfig = {
  text: string;
  values: any[];
};

export interface DisplayFileDTO extends DisplayFile {
  file: string;
}
