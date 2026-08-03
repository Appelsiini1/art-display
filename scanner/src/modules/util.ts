import fs from "node:fs";
import crypto from "node:crypto";
import { ScanOptions, FileFingerprint } from "../models/types";
import { basename, extname } from "node:path";

const RDF_LI_RE = /<rdf:li[^>]*>\s*([^<]+?)\s*<\/rdf:li>/g;
export let IGNORE_SET: Set<string> =
  new Set(process.env.IGNORE_TAGS?.split(",")) || null;

const RETRYABLE_ERROR_CODES = new Set([
  "EBUSY",
  "EAGAIN",
  "EMFILE",
  "ENFILE",
  "ECONNRESET",
  "EHOSTUNREACH",
]);

const ACCETABLE_FILE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg"];
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

function sleep(ms: number) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForDb(pollMs = 500, timeoutMs?: number) {
  const start = Date.now();
  while (true) {
    try {
      if (await getDBStatus()) return;
    } catch {
      // ignore transient errors while DB is coming up
    }
    if (timeoutMs && Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out after ${timeoutMs}ms waiting for DB to be ready`,
      );
    }
    await sleep(pollMs);
  }
}

export async function computeFingerprint(
  filePath: string,
  stat: fs.Stats,
): Promise<FileFingerprint> {
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(filePath);
  for await (const chunk of stream) hash.update(chunk);
  return { size: stat.size, mtimeMs: stat.mtimeMs, hash: hash.digest("hex") };
}

export async function readFileWithRetry(
  filePath: string,
  retries: number,
  retryBaseMs: number,
) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fs.promises.readFile(filePath, "utf8");
    } catch (err: any) {
      lastErr = err;
      if (attempt >= retries) break;
      if (!err || !RETRYABLE_ERROR_CODES.has(err.code)) break;
      await sleep(retryBaseMs * 2 ** attempt);
    }
  }
  throw lastErr;
}

export async function getFileMetadata(filePath: string, options: ScanOptions) {
  let lastErr;
  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await fs.promises.stat(filePath);
    } catch (err: any) {
      lastErr = err;
      if (attempt >= options.retries) break;
      if (!err || !RETRYABLE_ERROR_CODES.has(err.code)) break;
      await sleep(options.retryMs * 2 ** attempt);
    }
  }
  throw lastErr;
}

export function extractAllTags(content: string) {
  const out = [];
  let m;
  RDF_LI_RE.lastIndex = 0;
  while ((m = RDF_LI_RE.exec(content)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

export function findMatchingTags(tags: string[], requestedTags: Array<string>) {
  const requestedSet = new Set(requestedTags);
  const matched = new Set();
  for (const value of tags) {
    if (requestedSet.has(value)) {
      matched.add(value);
    }
  }
  return requestedTags.filter((t) => matched.has(t));
}

export function containsIgnoreTags(tagList: string[]): Boolean {
  if (IGNORE_SET === null) return false;
  return tagList.some((item) => IGNORE_SET.has(item));
}

const ARTIST_RE = /Artist Archive[\/\\]+([^\/\\]+)/;

export function extractArtist(filePath: string) {
  const match = filePath.match(ARTIST_RE);
  return match ? match[1] : null;
}

export function getDBStatus(): Promise<Boolean> {
  return new Promise((resolve, reject) => {
    fetch(new Request("http://api:9000/status"))
      .then(async (response) => {
        const resJson = await response.json();
        resolve(resJson.ready ? true : false);
      })
      .catch((reason) => {
        console.error(reason);
        reject(reason);
      });
  });
}

export function stripXmpExtension(filePath: string): string {
  return filePath.replace(/\.xmp$/i, "");
}

export function logMessage(
  msg: string,
  level: "debug" | "info" | "error" | "warn",
) {
  if (
    (level === "debug" && LOG_LEVEL === "info") ||
    ((level === "info" || level === "debug") && LOG_LEVEL === "warn") ||
    ((level === "debug" || level === "info" || level === "warn") &&
      LOG_LEVEL === "error")
  )
    return;
  const time = new Date();
  const message = `${time.toLocaleString()} | ${level.toLocaleUpperCase()} | ${msg}`;
  if (level === "info" || level === "debug") {
    console.log(message);
  } else if (level === "error") {
    console.error(message);
  } else {
    console.warn(message);
  }
}

export function isAccetableFileExtension(filePath: string) {
  const ext = extname(basename(filePath, ".xmp")).toLocaleLowerCase();
  if (ACCETABLE_FILE_EXTENSIONS.find((value) => ext === value)) return true;
  return false;
}
