import path from "node:path";
import { Router } from "express";
import { getDisplayStatistics, getImageServeStatistics, getRunHistory } from "../services/statisticsService";
import { logMessage } from "../modules/util";

const router = Router();
const staticRoot = path.join(__dirname, "..", "public");

router.get("/statistics", (req, res) => {
  res.sendFile(path.join(staticRoot, "statistics", "index.html"));
});

router.get("/statistics.html", (req, res) => {
  res.sendFile(path.join(staticRoot, "statistics", "index.html"));
});

router.get("/statistics/scan-runs", (req, res) => {
  res.sendFile(path.join(staticRoot, "statistics", "scan-runs.html"));
});

router.get("/statistics/display-files", (req, res) => {
  res.sendFile(path.join(staticRoot, "statistics", "display-files.html"));
});

router.get("/statistics/image-serves", (req, res) => {
  res.sendFile(path.join(staticRoot, "statistics", "image-serves.html"));
});

router.get("/api/statistics/run_history", async (req, res) => {
  const hoursParam = req.query.hours?.toString();
  const sinceParam = req.query.since?.toString();

  if (hoursParam && sinceParam) {
    res.status(400).send("Use either 'hours' or 'since', not both.");
    return;
  }

  try {
    let since: Date | undefined;

    if (sinceParam) {
      const parsedSince = new Date(sinceParam);
      if (Number.isNaN(parsedSince.getTime())) {
        res.status(400).send("Invalid 'since' timestamp.");
        return;
      }
      since = parsedSince;
    } else if (hoursParam) {
      const hours = Number(hoursParam);
      if (!Number.isFinite(hours) || hours <= 0) {
        res.status(400).send("'hours' must be a positive number.");
        return;
      }
      since = new Date(Date.now() - hours * 60 * 60 * 1000);
    }

    const history = await getRunHistory(since);
    res.status(200).json(history);
  } catch (err: any) {
    res.status(500).send("Internal Server Error");
    logMessage(err.message, "error");
  }
});

router.get("/api/statistics/display_files", async (req, res) => {
  try {
    const summary = await getDisplayStatistics();
    res.status(200).json(summary);
  } catch (err: any) {
    res.status(500).send("Internal Server Error");
    logMessage(err.message, "error");
  }
});

router.get("/api/statistics/image_serves", async (req, res) => {
  const hoursParam = req.query.hours?.toString();
  const sinceParam = req.query.since?.toString();

  if (hoursParam && sinceParam) {
    res.status(400).send("Use either 'hours' or 'since', not both.");
    return;
  }

  try {
    let since: Date | undefined;

    if (sinceParam) {
      const parsedSince = new Date(sinceParam);
      if (Number.isNaN(parsedSince.getTime())) {
        res.status(400).send("Invalid 'since' timestamp.");
        return;
      }
      since = parsedSince;
    } else if (hoursParam) {
      const hours = Number(hoursParam);
      if (!Number.isFinite(hours) || hours <= 0) {
        res.status(400).send("'hours' must be a positive number.");
        return;
      }
      since = new Date(Date.now() - hours * 60 * 60 * 1000);
    }

    const summary = await getImageServeStatistics(since);
    res.status(200).json(summary);
  } catch (err: any) {
    res.status(500).send("Internal Server Error");
    logMessage(err.message, "error");
  }
});

export default router;
