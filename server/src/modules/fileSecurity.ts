import fs from "node:fs/promises";
import { logMessage } from "./util";

const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export async function isSafeImagePath(
  candidatePath: string,
): Promise<boolean> {
    try {
    await fs.access(candidatePath, fs.constants.F_OK | fs.constants.R_OK);

    const stats = await fs.stat(candidatePath);
    if (!stats.isFile()) {
      logMessage(`Path exists but is not a regular file: ${candidatePath}`, 'warn');
      return false;
    }

    logMessage(`File is available: ${candidatePath}`, 'debug');
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logMessage(`File not available at ${candidatePath}: ${error.message}`, 'error');
    } else {
      logMessage(`File not available at ${candidatePath}: unknown error`, 'error');
    }
    return false;
  }
}

export async function detectImageMimeType(
  filePath: string,
): Promise<string | null> {
  try {
    const handle = await fs.open(filePath, "r");
    const { buffer } = await handle.read(Buffer.alloc(4100), 0, 4100, 0);
    await handle.close();

    // PNG
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    )
      return "image/png";

    // JPEG
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
      return "image/jpeg";

    // GIF (GIF87a or GIF89a)
    if (
      buffer.length >= 6 &&
      buffer.slice(0, 3).toString() === "GIF"
    )
      return "image/gif";

    // WEBP (RIFF....WEBP)
    if (
      buffer.length >= 12 &&
      buffer.slice(0, 4).toString() === "RIFF" &&
      buffer.slice(8, 12).toString() === "WEBP"
    )
      return "image/webp";

    // SVG (text-based, look for '<svg' within start)
    const startText = buffer.toString("utf8", 0, Math.min(1024, buffer.length));
    if (startText.includes("<svg") || startText.includes("<?xml")) return "image/svg+xml";

    return null;
  } catch (err: any) {
    logMessage(`detectImageMimeType error: ${err.message}`, "warn");
    return null;
  }
}

export function isAllowedMime(mime: string) {
  return ALLOWED_MIMES.has(mime);
}
