import fs from "node:fs";
import path from "node:path";
import { Response } from "express";
import { DisplayFile, DisplayFileDTO } from "../models/types";

function getMIMEType(filepath: string): string {
  try {
    const extension = path.extname(filepath);
    let dataString = `image/`;
    switch (extension.replace(".", "").toLowerCase()) {
      case "png":
        dataString += "png";
        break;
      case "jpg":
        dataString += "jpeg";
        break;
      case "jpeg":
        dataString += "jpeg";
        break;
      case "gif":
        dataString += "gif";
        break;
      case "svg":
        dataString += "svg+xml";
        break;
      default:
        throw new Error("error_unsupported_image");
    }
    return dataString;
  } catch (err: any) {
    logMessage(`Error in getMIMEType(): ${err.message}`, "error");
    throw err;
  }
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomIntInclusive(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}

export async function getFile(res: Response, filepath: string) {
  return new Promise((resolve, reject) => {
    try {
      const { size } = fs.statSync(filepath);
      const rs = fs.createReadStream(filepath);
      res.setHeader("Content-Type", getMIMEType(filepath));
      res.setHeader("Content-Length", size);
      rs.pipe(res);

      rs.on("end", () => {
        resolve(null);
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

const LOG_LEVEL = process.env.LOG_LEVEL || "info";

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
