import { Router } from "express";
import { query, validationResult } from "express-validator";
import { logMessage } from "../modules/util";
import {
  getMetadataEntry,
  listMetadataEntries,
  upsertMetadataValue,
} from "../services/metadataService";

const router = Router();

router.post("/api/metadata", async (req, res) => {
  const valueID = req.query.name?.toString();
  const value = req.query.value?.toString();

  if (!value || !valueID) {
    res.status(400).send("Parameters missing");
    return;
  }

  try {
    const previousValue = await getMetadataEntry(valueID);
    await upsertMetadataValue(valueID, value);
    if (previousValue === undefined) {
      res.status(200).send(`Added metadata value with id ${valueID} to database.`);
      return;
    }

    res.status(200).send(`Updated metadata value with id ${valueID} in the database.`);
  } catch (err: any) {
    res.status(500).send("Internal Server Error");
    logMessage(err.message, "error");
  }
});

router.get("/api/metadata/get", query("name").trim().notEmpty(), async (req, res) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    try {
      const result = await getMetadataEntry(req.query?.name as string);
      logMessage(`Serving metadata value with id ${req.query?.name}. Value: ${result?.value}`, "info");
      res.status(200).send({ id: req.query?.name, value: result?.value });
    } catch (err: any) {
      res.status(500).send("Internal Server Error");
      logMessage(err.message, "error");
    }
    return;
  }

  res.status(400).send("Invalid request.");
});

router.get("/api/metadata/get/all", async (req, res) => {
  try {
    const result = await listMetadataEntries();
    logMessage(`Serving all metadata values. Count: ${result.length}`, "info");
    res.status(200).send({ metadata: result });
  } catch (err: any) {
    res.status(500).send("Internal Server Error");
    logMessage(err.message, "error");
  }
});

router.get("/api/status", async (req, res) => {
  const isReady = (req.app.locals as { dbReady?: number }).dbReady === 1;
  res.status(200).send({ ready: isReady });
});

export default router;
