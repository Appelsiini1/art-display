import fs from "node:fs";
import path from "node:path";

export function getBase64String(filepath: string): string {
  try {
    const data = fs.readFileSync(filepath, "base64");
    const extension = path.extname(filepath);
    let dataString = `data:image/`;
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
    dataString += `;base64,${data}`;
    return dataString;
  } catch (err: any) {
    console.error("Error in getBase64String():", err.message);
    throw err;
  }
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
export function getRandomIntInclusive(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}
