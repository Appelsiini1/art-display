const PORT = 9000;

import express from "express";

const app = express();
app.listen(PORT, () =>
  console.log(`Server online at http://localhost:${PORT}`)
);

app.get("/image", (req, res) => {});

app.post("/database", (req, res) => {});
