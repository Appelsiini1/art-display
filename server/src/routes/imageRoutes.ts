import { Router } from "express";
import { query, validationResult } from "express-validator";
import { getFile, logMessage, transfromToDTO } from "../modules/util";
import { getFileByIdResponse, getImageById, serveRandomImage } from "../services/imageService";

const router = Router();

router.get("/api/img/file", query("id").trim().notEmpty(), async (req, res) => {
  const result = validationResult(req);
  try {
    if (result.isEmpty()) {
      const imageData = await getFileByIdResponse(req.query?.id as string);
      if (!imageData) {
        throw new Error(`Database call failed for file id ${req.query?.id}.`);
      }

      if (!imageData.safe) {
        res.status(404).send("File not found.");
        return;
      }

      await getFile(res, imageData.imageInfo.path);
      return;
    }

    res.status(400).send("Invalid request.");
  } catch (err: any) {
    res.status(500).send("Internal Server Error");
    logMessage(err.message, "error");
  }
});

router.get("/api/img", query("id").trim().notEmpty(), async (req, res) => {
  const result = validationResult(req);
  try {
    if (result.isEmpty()) {
      const imgInfo = await getImageById(req.query?.id as string);
      if (!imgInfo) {
        throw new Error(`Database call failed for file id ${req.query?.id}.`);
      }

      if (typeof imgInfo === "undefined") {
        res.status(404).send(`File with '${req.query?.id}' not found in the database.`);
        return;
      }

      res.status(200).json(transfromToDTO(imgInfo));
      return;
    }

    res.status(400).send("Invalid request.");
  } catch (err: any) {
    if (err.message == -1) {
      res.status(404).send(`File with '${req.query?.id}' not found in the database.`);
      return;
    }

    res.status(500).send("Internal Server Error");
    logMessage(err.message, "error");
  }
});

router.get("/api/img/random", async (req, res) => {
  try {
    const imgInfo = await serveRandomImage();
    if (!imgInfo) {
      res.status(404).send("No valid images available.");
      return;
    }

    res.status(200).json(imgInfo);
  } catch (err: any) {
    res.status(500).send("Internal Server Error");
    logMessage(err.message, "error");
  }
});

export default router;
