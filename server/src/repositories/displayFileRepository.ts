import { getDisplayFileById as fetchDisplayFileById, getDisplayFileSummary as fetchDisplayFileSummary, getRandomDisplayFile as fetchRandomDisplayFile } from "../modules/db/displayFiles";
import { getImageServeSummary as fetchImageServeSummary, getScanRunHistory as fetchScanRunHistory, recordImageServeEvent as persistImageServeEvent } from "../modules/db/statistics";
import { DisplayFile, DisplayFileSummary, ImageServeSummary, ScanRunSummary } from "../models/types";

export async function getRandomDisplayFile(rating: "all" | string = "all"): Promise<DisplayFile> {
  return fetchRandomDisplayFile(rating);
}

export async function getDisplayFileById(id: string): Promise<DisplayFile | undefined> {
  return fetchDisplayFileById(id);
}

export async function getDisplayFileSummary(): Promise<DisplayFileSummary> {
  return fetchDisplayFileSummary();
}

export async function getScanRunHistory(since?: Date | string): Promise<ScanRunSummary[]> {
  return fetchScanRunHistory(since);
}

export async function getImageServeSummary(since?: Date | string): Promise<ImageServeSummary> {
  return fetchImageServeSummary(since);
}

export async function recordImageServeEvent(
  fileId: string,
  filePath: string,
  artist: string | null,
  rating: "sfw" | "nsfw",
) {
  return persistImageServeEvent(fileId, filePath, artist, rating);
}
