import express from "express";
import path from "node:path";
import { query, validationResult } from "express-validator";
import {
  getDisplayFileById,
  getMetadataValue,
  getRandomDisplayFile,
  initDbTables,
  insertRow,
} from "./modules/database";
import { getFile, logMessage, transfromToDTO } from "./modules/util";
const cors = require("cors");

const PORT = 9000;
const app = express();
let DB_INIT = 0;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors());
/* app.use((req, res) => {
  res.status(404);
  res.send("<h1>Error 404: Resource not found.</h1>");
}); */
initDbTables().then(() => {
  app.listen(PORT, () => {
    logMessage(`Server online at http://localhost:${PORT}`, "info");
    DB_INIT = 1;
  });
});

//URL/img?id=value
app.get("/img/file", query("id").trim().notEmpty(), async (req, res) => {
  const result = validationResult(req);
  try {
    if (result.isEmpty()) {
      const imgInfo = await getDisplayFileById(req.query?.id);
      if (!imgInfo)
        throw new Error(`Database call failed for file id ${req.query?.id}.`);
      if (typeof imgInfo == "undefined") {
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
    logMessage(err.message, "error");
  }
});
app.get("/status", async (req, res) => {
  if (DB_INIT === 1) {
    res.status(200).send({ ready: true });
  } else {
    res.status(200).send({ ready: false });
  }
});

app.get("/img", query("id").trim().notEmpty(), async (req, res) => {
  const result = validationResult(req);
  try {
    if (result.isEmpty()) {
      const imgInfo = await getDisplayFileById(req.query?.id);
      if (!imgInfo)
        throw new Error(`Database call failed for file id ${req.query?.id}.`);

      if (typeof imgInfo == "undefined") {
        res
          .status(404)
          .send(`File with '${req.query?.id}' not found in the database.`);
      } else {
        res.status(200).json(transfromToDTO(imgInfo));
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
      logMessage(err.message, "error");
    }
  }
});

app.get("/img/random", async (req, res) => {
  try {
    const rating = await getMetadataValue("currentRating");
    const imgInfo = await getRandomDisplayFile(rating ? rating.value : "sfw");
    logMessage(`Serving '${imgInfo.path}'`, "info");
    res.status(200).json(transfromToDTO(imgInfo));
  } catch (err: any) {
    res.status(500).send("Internal Server Error");
    logMessage(err.message, "error");
  }
});

// app.post(
//   "/database/update",
//   checkSchema(displayFileSchemaUpdate, ["body"]),
//   async (req: Request, res: Response) => {
//     try {
//       const result = validationResult(req);
//       if (result.isEmpty()) {
//         const rq_body = req.body;
//         await updateDisplayFilesToDB(rq_body);
//         res.status(200).send("Operation successful.");
//       } else {
//         res.status(400).send("Invalid request.");
//       }
//     } catch (err: any) {
//       res.status(500).send("Internal Server Error");
//       console.error(err.message);
//     }
//   },
// );

// app.post(
//   "/database/add",
//   checkSchema(displayFileSchema, ["body"]),
//   async (req: Request, res: Response) => {
//     try {
//       const result = validationResult(req);
//       if (result.isEmpty()) {
//         const rq_body = req.body;
//         await addDisplayFileToDB(rq_body);
//         res.status(200).send("Operation successful.");
//       } else {
//         res.status(400).send("Invalid request.");
//       }
//     } catch (err: any) {
//       res.status(500).send("Internal Server Error");
//       console.error(err.message);
//     }
//   },
// );

app.post("/metadata", async (req, res) => {
  const valueID = req.query.id?.toString();
  const value = req.query.value?.toString();

  if (!value || !valueID) {
    res.status(400).send("Parameters missing");
  } else {
    try {
      const prev_value = await getMetadataValue(valueID);
      if (prev_value == undefined) {
        await insertRow("metadata", { name: valueID, value });
        res
          .status(200)
          .send(`Added metadata value with id ${valueID} to database.`);
      } else {
        await insertRow("metadata", { name: valueID, value });
        res
          .status(200)
          .send(`Updated metadata value with id ${valueID} in the database.`);
      }
    } catch (err: any) {
      res.status(500).send("Internal Server Error");
      logMessage(err.message, "error");
    }
  }
});

app.get("/metadata/get", query("name").trim().notEmpty(), async (req, res) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    try {
      const result = await getMetadataValue(req.query?.name);
      logMessage(`Serving metadata value with id ${req.query?.name}. Value: ${result?.value}`, "info");

      res.status(200).send({ id: req.query?.name, value: result?.value });
    } catch (err: any) {
      res.status(500).send("Internal Server Error");
      logMessage(err.message, "error");
    }
  }
});
