import {
  allMetadataValues,
  createMetadataValue,
  getMetadataValue,
  updateMetadataValue,
} from "../repositories/metadataRepository";

export async function getCurrentRating(): Promise<string> {
  const rating = await getMetadataValue("currentRating");
  return rating ? rating.value : "sfw";
}

export async function getMetadataEntry(name: string) {
  return getMetadataValue(name);
}

export async function listMetadataEntries() {
  return allMetadataValues();
}

export async function upsertMetadataValue(name: string, value: string) {
  const existing = await getMetadataValue(name);
  if (existing === undefined) {
    return createMetadataValue(name, value);
  }
  return updateMetadataValue(name, value);
}
