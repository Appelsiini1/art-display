import {
  getDisplayFileSummary,
  getImageServeSummary,
  getScanRunHistory,
} from "../repositories/displayFileRepository";

export async function getDisplayStatistics() {
  return getDisplayFileSummary();
}

export async function getRunHistory(when?: Date | string) {
  return getScanRunHistory(when);
}

export async function getImageServeStatistics(when?: Date | string) {
  return getImageServeSummary(when);
}
