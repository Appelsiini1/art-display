import {
  allMetadataValues as fetchAllMetadataValues,
  getMetadataValue as fetchMetadataValue,
  insertRow,
  updateRow,
} from "../modules/db/metadata";
import { MetadataRow } from "../models/types";

export async function getMetadataValue(name: string): Promise<MetadataRow | undefined> {
  return fetchMetadataValue(name);
}

export async function allMetadataValues(): Promise<MetadataRow[]> {
  return fetchAllMetadataValues();
}

export async function createMetadataValue(name: string, value: string) {
  return insertRow("metadata", { name, value });
}

export async function updateMetadataValue(name: string, value: string) {
  return updateRow("metadata", { value }, { name });
}
