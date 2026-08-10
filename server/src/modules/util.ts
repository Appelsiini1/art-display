import fs from "node:fs";
import path from "node:path";
import { Response } from "express";
import { DisplayFile, DisplayFileDTO } from "../models/types";
import { detectImageMimeType } from "./fileSecurity";

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomIntInclusive(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}

export async function getFile(res: Response, filepath: string) {
  return new Promise(async (resolve, reject) => {
    try {
      const { size } = fs.statSync(filepath);
      const mime = await detectImageMimeType(filepath);
      if (!mime) throw new Error("error_unsupported_image");
      const rs = fs.createReadStream(filepath);
      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Length", size);
      rs.pipe(res);

      rs.on("end", () => {
        resolve(null);
      });
      rs.on("error", (e) => {
        logMessage(`Stream error in getFile(): ${e.message}`, "error");
        reject(null);
      });
    } catch (err: any) {
      logMessage(`Error in getFile(): ${err.message}`, "error");
      reject(null);
    }
  });
}

export function transfromToDTO(imgInfo: DisplayFile): DisplayFileDTO {
  return { ...imgInfo, file: path.basename(imgInfo.path) };
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
