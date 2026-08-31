import {
  fingerprintWriter,
  displayFileBatchWriter,
  displayFileDeleteWriter,
  selectAllFingerprintPaths,
  deleteStaleFingerprintsAndDisplayFiles,
} from "./modules/db";
import {
  getDBStatus,
  logMessage,
  waitForDb,
  RECONCILE_MAX_STALE_FRACTION,
  RECONCILE_FORCE,
} from "./modules/util";
import {
  processOne,
  processFilesConcurrently,
  walkXmpFiles,
} from "./modules/xmpProcess";
import { startRun, finishAndPersist } from "./modules/metrics";

async function reconcile(walked: Set<string>): Promise<void> {
  const dbPaths = await selectAllFingerprintPaths();
  if (dbPaths.length === 0) {
    logMessage(
      "Reconciliation: nothing to sweep (fingerprint table empty).",
      "info",
    );
    return;
  }
  const stale = dbPaths.filter((p) => !walked.has(p));
  const fraction = stale.length / dbPaths.length;

  if (stale.length === 0) {
    logMessage(
      `Reconciliation: no stale rows (walked ${walked.size}, stored ${dbPaths.length}).`,
      "info",
    );
    return;
  }

  if (fraction > RECONCILE_MAX_STALE_FRACTION) {
    if (!RECONCILE_FORCE) {
      logMessage(
        `Reconciliation: skipped, stale fraction ${fraction.toFixed(4)} exceeds threshold ${RECONCILE_MAX_STALE_FRACTION}. Set RECONCILE_FORCE=1 to bypass.`,
        "warn",
      );
      return;
    }
    logMessage(
      `Reconciliation: RECONCILE_FORCE=1 bypassed guard (stale fraction ${fraction.toFixed(4)}). Proceeding with delete.`,
      "info",
    );
  }

  const removed = await deleteStaleFingerprintsAndDisplayFiles(stale);
  logMessage(
    `Reconciliation: removed ${removed.fingerprints} stale fingerprints, ${removed.displayFiles} display_files rows (walked ${walked.size}, stored ${dbPaths.length}).`,
    "info",
  );
}

async function main() {
  const options = {
    concurrency: Number(process.env.CONCURRENCY) || 4,
    retries: Number(process.env.RETRIES) || 2,
    retryMs: Number(process.env.RETRY_MS) || 250,
  };
  const dirArg = process.env.SCANDIR;

  if (!dirArg) {
    logMessage("No scan directory set in env!", "error");
    process.exit(-1);
  }

  let ignore = {
    filePatterns: [/\.psd(\.|$)/i],
    dirPatterns: [],
  };

  logMessage("Waiting for DB to be ready...", "info");
  await waitForDb(500, 30_000); // poll every 500ms, give up after 30s
  logMessage("DB ready, starting scan loop.", "info");

  let running = false;
  const runScan = async () => {
    if (running) return;
    running = true;
    let sweepAllowed = true;
    const walked = new Set<string>();
    try {
      try {
        startRun({ scanDir: dirArg });
      } catch (err: any) {
        logMessage(`Metrics startRun error: ${err && err.message ? err.message : err}`, "warn");
      }
      if (!(await getDBStatus())) return;
      logMessage("Starting scan...", "info");

      try {
        await processFilesConcurrently(
          walkXmpFiles(dirArg, dirArg, ignore),
          options,
          processOne,
          walked,
        );
      } catch (err: any) {
        sweepAllowed = false;
        logMessage(
          `Walk error: ${err && err.stack ? err.stack : err}`,
          "error",
        );
      }

      try {
        await fingerprintWriter.close();
        await displayFileBatchWriter.close();
        await displayFileDeleteWriter.close();
      } catch (err: any) {
        sweepAllowed = false;
        logMessage(
          `Batch flush error on close: ${err && err.stack ? err.stack : err}`,
          "error",
        );
      }

      try {
        await finishAndPersist();
      } catch (err: any) {
        logMessage(`Metrics finish error: ${err && err.stack ? err.stack : err}`, "warn");
      }

      if (!sweepAllowed) {
        logMessage("Reconciliation: skipped due to unclean walk.", "warn");
      } else {
        try {
          await reconcile(walked);
        } catch (err: any) {
          logMessage(
            `Reconciliation error: ${err && err.stack ? err.stack : err}`,
            "error",
          );
        }
      }
    } finally {
      running = false;
      logMessage("Scan finished.", "info");
    }
  };

  await runScan();
  setInterval(runScan, 86400 * 1000);
}

main().catch((err) => {
  if (err && err.code === "EPIPE") {
    process.exit(0);
  }
  logMessage(
    `\nUnexpected error: ${err && err.stack ? err.stack : err}\n`,
    "error",
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
