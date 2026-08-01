export interface DisplayFile {
  artist: string | null;
  nsfw: boolean;
  path: string;
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
