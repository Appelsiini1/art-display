import fs from "node:fs";
import path from "node:path";
import { Response } from "express";
import { env } from "node:process";

function getMIMEType(filepath: string): string {
  try {
    const extension = path.extname(filepath);
    let dataString = `image/`;
    switch (extension.replace(".", "")) {
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
    console.error("Error in getMIMEType():", err.message);
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
      const prefix = env.PATH_PREFIX;
      if (!prefix) throw new Error("No path prefix found in env!");
      const fullPath = path.join(prefix, filepath);
      const { size } = fs.statSync(fullPath);
      const rs = fs.createReadStream(fullPath);
      res.setHeader("Content-Type", getMIMEType(fullPath));
      res.setHeader("Content-Length", size);
      rs.pipe(res);

      rs.on("end", () => {
        resolve(null);
      });
    } catch (err: any) {
      console.error("Error in getFile():");
      console.error(err.message);
      reject(null);
    }
  });
}
