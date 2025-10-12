export interface displayFile {
  id: number;
  artist: string;
  path: string;
  type: string;
  rating: "sfw" | "nsfw";
}

export interface metadataRow {
  id: string;
  value: string;
}

export interface displayFileDTO extends displayFile {
  file: string;
}
