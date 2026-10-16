import { isSafeImagePath } from "../modules/fileSecurity";
import { getFile, transfromToDTO } from "../modules/util";
import { DisplayFile, DisplayFileDTO } from "../models/types";
import {
  getDisplayFileById,
  getRandomDisplayFile,
  recordImageServeEvent,
} from "../repositories/displayFileRepository";
import { getMetadataValue } from "../repositories/metadataRepository";

export async function getImageById(id: string): Promise<DisplayFile | undefined> {
  return getDisplayFileById(id);
}

export async function getFileByIdResponse(id: string): Promise<{ imageInfo: DisplayFile; safe: boolean } | undefined> {
  const imageInfo = await getImageById(id);
  if (!imageInfo) {
    return undefined;
  }

  const safe = await isSafeImagePath(imageInfo.path);
  return { imageInfo, safe };
}

export async function getRandomImage(): Promise<DisplayFile | undefined> {
  const rating = await getMetadataValue("currentRating");
  const activeRating = rating ? rating.value : "sfw";
  const maxAttempts = 10;
  let attempts = 0;
  let candidate: DisplayFile | undefined;

  while (attempts < maxAttempts) {
    const possibleCandidate = await getRandomDisplayFile(activeRating);
    if (!possibleCandidate) {
      attempts += 1;
      continue;
    }

    const safe = await isSafeImagePath(possibleCandidate.path);
    if (!safe) {
      attempts += 1;
      continue;
    }

    candidate = possibleCandidate;
    break;
  }

  return candidate;
}

export async function serveRandomImage(): Promise<DisplayFileDTO | undefined> {
  const imageInfo = await getRandomImage();
  if (!imageInfo) {
    return undefined;
  }

  const serveRating = imageInfo.nsfw ? "nsfw" : "sfw";
  await recordImageServeEvent(
    imageInfo.id,
    imageInfo.path,
    imageInfo.artist ?? null,
    serveRating,
  );

  return transfromToDTO(imageInfo);
}

export async function getFileStream(res: any, filepath: string) {
  await getFile(res, filepath);
}
