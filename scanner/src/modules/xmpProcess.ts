import { DisplayFile, ScanOptions } from "../models/types";
import {
  readFileWithRetry,
  findMatchingTags,
  computeFingerprint,
  getFileMetadata,
  extractArtist,
  extractAllTags,
  containsIgnoreTags,
  stripXmpExtension,
  logMessage,
  isAccetableFileExtension,
} from "./util";
import path from "path";
import fs from "fs";
import {
  getCachedFingerprint,
  fingerprintWriter,
  displayFileBatchWriter,
  displayFileDeleteWriter,
} from "./db";

export async function processOne(filePath: string, options: ScanOptions) {
  logMessage(`Processing file: ${filePath}`, "debug");
  if (!isAccetableFileExtension(filePath)) {
    logMessage(
      `Skipping file '${path.basename(filePath)}' based on extension.`,
      "debug",
    );
    return;
  }

  // --- change-detection: skip if unchanged since last run ---
  let stat: fs.Stats = await getFileMetadata(filePath, options);

  const prev = await getCachedFingerprint(filePath);
  if (prev && prev.size === stat.size && prev.mtimeMs === stat.mtimeMs) {
    logMessage(
      `Skipping file '${path.basename(filePath)}' based on unchanged metadata.`,
      "debug",
    );
    return; // unchanged, skip
  }

  const fingerprint = await computeFingerprint(filePath, stat); // pass stat in, avoid re-stat-ing
  if (prev && prev.hash === fingerprint.hash) {
    await fingerprintWriter.add({ path: filePath, ...fingerprint });
    return;
  }

  let content;
  try {
    content = await readFileWithRetry(
      filePath,
      options.retries,
      options.retryMs,
    );
  } catch (err: any) {
    logMessage(`${filePath}: error reading file (${err.message})\n`, "error");
    return;
  }

  const tags = extractAllTags(content);

  if (containsIgnoreTags(tags)) {
    logMessage(
      `File '${filePath}' has IGNORE tag; purging any display_files row.`,
      "debug",
    );
    displayFileDeleteWriter.add(stripXmpExtension(filePath));
    return;
  }

  const matchedTags = findMatchingTags(tags, ["NSFW", "SFW"]);
  if (matchedTags.length > 0) {
    const df: DisplayFile = {
      path: stripXmpExtension(filePath),
      artist: extractArtist(filePath),
      nsfw: matchedTags.find((tag) => tag === "NSFW") ? true : false,
    };
    logMessage(
      `File '${filePath}' is new and has matched tags, adding to database.`,
      "debug",
    );
    displayFileBatchWriter.add(df);
  } else {
    logMessage(
      `File '${filePath}' has no matching tags; purging any display_files row.`,
      "debug",
    );
    displayFileDeleteWriter.add(stripXmpExtension(filePath));
  }
  logMessage(
    `File '${filePath}' is new, adding fingerprint to database.`,
    "debug",
  );
  await fingerprintWriter.add({ path: filePath, ...fingerprint });
  return;
}

export async function processFilesConcurrently(
  asyncIterable: any,
  options: ScanOptions,
  perFile: Function,
  walkedSet?: Set<string>,
) {
  const iterator = asyncIterable[Symbol.asyncIterator]();
  async function worker() {
    while (true) {
      const { value, done } = await iterator.next();
      if (done) return;
      if (walkedSet) walkedSet.add(value);
      await perFile(value, options);
    }
  }
  const workers = [];
  for (let i = 0; i < options.concurrency; i++) workers.push(worker());
  await Promise.all(workers);
}

function toRelPosix(scanRoot: string, full: string) {
  const rel = path.relative(scanRoot, full);
  if (path.sep === "/") return rel;
  return rel.split(path.sep).join("/");
}

function matchesAny(patterns: Array<RegExp>, relPath: string) {
  for (const re of patterns) {
    if (re.test(relPath)) return true;
  }
  return false;
}

export async function* walkXmpFiles(
  dir: string,
  scanRoot: string,
  ignore: {
    dirPatterns: Array<RegExp>;
    filePatterns: Array<RegExp>;
  },
): AsyncGenerator<string, void, unknown> {
  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (err: any) {
    logMessage(
      `\nWarning: cannot read directory ${dir}: ${err.message}\n`,
      "warn",
    );
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = toRelPosix(scanRoot, full);
    if (entry.isDirectory()) {
      if (ignore && matchesAny(ignore.dirPatterns, rel)) continue;
      yield* walkXmpFiles(full, scanRoot, ignore);
    } else if (entry.isFile() && /\.xmp$/i.test(entry.name)) {
      if (ignore && matchesAny(ignore.filePatterns, rel)) continue;
      yield full;
    }
  }
}
