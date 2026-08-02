import { fingerprintWriter } from "./modules/db";
import { getDBStatus } from "./modules/util";
import {
  processOne,
  processFilesConcurrently,
  walkXmpFiles,
} from "./modules/xmpProcess";

async function main() {
  const options = {
    concurrency: Number(process.env.CONCURRENCY) || 4,
    retries: Number(process.env.RETRIES) || 2,
    retryMs: Number(process.env.RETRY_MS) || 250,
  };
  const dirArg = process.env.SCANDIR;

  if (!dirArg) {
    process.stderr.write("No scan directory set in env!");
    process.exit(-1);
  }

  let ignore = {
    filePatterns: [/\.psd(\.|$)/i],
    dirPatterns: [],
  };

  setInterval(async () => {
    if (await getDBStatus()) {
      await processFilesConcurrently(
        walkXmpFiles(dirArg, dirArg, ignore),
        options,
        processOne,
      );
      await fingerprintWriter.close(); // flush any remainder sitting in the buffer
    }
  }, 86400);
}

main().catch((err) => {
  if (err && err.code === "EPIPE") {
    process.exit(0);
  }
  process.stderr.write(
    `\nUnexpected error: ${err && err.stack ? err.stack : err}\n`,
  );
  process.exit(1);
});

// Suppress noisy EPIPE traceback when stdout consumer closes early
// (e.g. `... | head`).
process.stdout.on("error", (err: any) => {
  if (err && err.code === "EPIPE") {
    process.exit(0);
  }
  throw err;
});
