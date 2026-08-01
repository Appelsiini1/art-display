import fs from "node:fs";
import crypto from "node:crypto";
import { ScanOptions, FileFingerprint } from "../models/types";

const RDF_LI_RE = /<rdf:li[^>]*>\s*([^<]+?)\s*<\/rdf:li>/g;

const RETRYABLE_ERROR_CODES = new Set([
  "EBUSY",
  "EAGAIN",
  "EMFILE",
  "ENFILE",
  "ECONNRESET",
  "EHOSTUNREACH",
]);

function sleep(ms: number) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function extractAllTags(content: string) {
  const out = [];
  let m;
  RDF_LI_RE.lastIndex = 0;
  while ((m = RDF_LI_RE.exec(content)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

export function findMatchingTags(
  content: string,
  requestedTags: Array<string>,
) {
  const requestedSet = new Set(requestedTags);
  const matched = new Set();
  for (const value of extractAllTags(content)) {
    if (requestedSet.has(value)) {
      matched.add(value);
    }
  }
  // Preserve the order tags were requested in.
  return requestedTags.filter((t) => matched.has(t));
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
        process.stderr.write(reason);
        reject(reason);
      });
  });
}
