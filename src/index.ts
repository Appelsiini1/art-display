import express from "express";
import path from "node:path";

const PORT = 9000;
const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use((req, res) => {
  res.status(404);
  res.send("<h1>Error 404: Resource not found.</h1>");
});

app.listen(PORT, () =>
  console.log(`Server online at http://localhost:${PORT}`)
);

//app.get("/image", (req, res) => {});

app.post("/database", (req, res) => {});
