import express from "express";
import path from "node:path";
import { initDbTables } from "./modules/database";
import { logMessage } from "./modules/util";
import imageRoutes from "./routes/imageRoutes";
import metadataRoutes from "./routes/metadataRoutes";
import statisticsRoutes from "./routes/statisticsRoutes";

const PORT = 9000;
const app = express();
app.locals.dbReady = 0;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.use((req, res, next) => {
  const apiHost = process.env.IMG_API_URL || `${req.protocol}://${req.headers.host}`;
  const csp = `default-src 'self'; img-src 'self' data: blob: ${apiHost}; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`;
  res.setHeader("Content-Security-Policy", csp);
  next();
});

app.use(imageRoutes);
app.use(metadataRoutes);
app.use(statisticsRoutes);

initDbTables().then(() => {
  app.listen(PORT, () => {
    app.locals.dbReady = 1;
    logMessage(`Server online at http://localhost:${PORT}`, "info");
  });
});

export default app;
