import express, { Request, Response } from "express";
import path from "node:path";
import { query, validationResult, checkSchema } from "express-validator";
import {
  addDisplayFileToDB,
  addMetadataValueDB,
  getDisplayFile,
  getMetadataValue,
  getRandomDisplayFile,
  initDatabase,
  updateDisplayFilesToDB,
  updateMetadataValueDB,
} from "./modules/database";
import { displayFileSchema, displayFileSchemaUpdate } from "./models/schemas";
import { getFile } from "./modules/util";

const PORT = 9000;
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
/* app.use((req, res) => {
  res.status(404);
  res.send("<h1>Error 404: Resource not found.</h1>");
}); */
initDatabase().then(() => {
  app.listen(PORT, () =>
    console.log(`Server online at http://localhost:${PORT}`)
  );
});

//URL/img?id=value
app.get(
  "/img/file",
  query("id").trim().notEmpty().isInt(),
  async (req, res) => {
    const result = validationResult(req);
    try {
      if (result.isEmpty()) {
        const imgInfo = await getDisplayFile(req.query?.id);
        if (typeof imgInfo == "number") {
          res
            .status(404)
            .send(`File with '${req.query?.id}' not found in the database.`);
        } else {
          getFile(res, imgInfo.path);
        }
      } else {
        res.status(400).send("Invalid request.");
      }
    } catch (err: any) {
      res.status(500).send("Internal Server Error");
      console.error(err.message);
    }
  }
);

app.get("/img", query("id").trim().notEmpty().isInt(), async (req, res) => {
  const result = validationResult(req);
  try {
    if (result.isEmpty()) {
      const imgInfo = await getDisplayFile(req.query?.id);
      if (typeof imgInfo == "number") {
        res
          .status(404)
          .send(`File with '${req.query?.id}' not found in the database.`);
      } else {
        res.status(200).json(imgInfo);
      }
    } else {
      res.status(400).send("Invalid request.");
    }
  } catch (err: any) {
    if (err.message == -1) {
      res
        .status(404)
        .send(`File with '${req.query?.id}' not found in the database.`);
    } else {
      res.status(500).send("Internal Server Error");
      console.error(err.message);
    }
  }
});

app.get("/img/random", async (req, res) => {
  try {
    const rating = await getMetadataValue("currentRating");
    const imgInfo = await getRandomDisplayFile(rating.value);

    getFile(res, imgInfo.path);
  } catch (err: any) {
    res.status(500).send("Internal Server Error");
    console.error(err.message);
  }
});

app.post(
  "/database/update",
  checkSchema(displayFileSchemaUpdate, ["body"]),
  async (req: Request, res: Response) => {
    try {
      const result = validationResult(req);
      if (result.isEmpty()) {
        const rq_body = req.body;
        await updateDisplayFilesToDB(rq_body);
        res.status(200).send("Operation successful.");
      } else {
        res.status(400).send("Invalid request.");
      }
    } catch (err: any) {
      res.status(500).send("Internal Server Error");
      console.error(err.message);
    }
  }
);

app.post(
  "/database/add",
  checkSchema(displayFileSchema, ["body"]),
  async (req: Request, res: Response) => {
    try {
      const result = validationResult(req);
      if (result.isEmpty()) {
        const rq_body = req.body;
        await addDisplayFileToDB(rq_body);
        res.status(200).send("Operation successful.");
      } else {
        res.status(400).send("Invalid request.");
      }
    } catch (err: any) {
      res.status(500).send("Internal Server Error");
      console.error(err.message);
    }
  }
);

app.post("/metadata", async (req, res) => {
  const valueID = req.query.id?.toString();
  const value = req.query.value?.toString();

  if (!value || !valueID) {
    res.status(400).send("Parameters missing");
  } else {
    try {
      const prev_value = getMetadataValue(valueID);
      if (prev_value == undefined) {
        await addMetadataValueDB(valueID, value);
        res
          .status(200)
          .send(`Added metadata value with id ${valueID} to database.`);
      } else {
        await updateMetadataValueDB(valueID, value);
        res
          .status(200)
          .send(`Updated metadata value with id ${valueID} in the database.`);
      }
    } catch (err: any) {
      res.status(500).send("Internal Server Error");
      console.error(err.message);
    }
  }
});

app.get("/metadata/get", query("name").trim().notEmpty(), async (req, res) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    try {
      const value = await getMetadataValue(req.query?.name);

      res.status(200).send({ id: req.query?.name, value: value });
    } catch (err: any) {
      res.status(500).send("Internal Server Error");
      console.error(err.message);
    }
  }
});
