import { execQuery } from "./connection";

export async function initDbTables() {
  await execQuery(
    "CREATE TABLE IF NOT EXISTS display_files (\
    path        TEXT PRIMARY KEY,\
    artist      TEXT,\
    nsfw        BOOLEAN,\
    id          UUID\
);",
  );
  await execQuery(
    "CREATE TABLE IF NOT EXISTS metadata (\
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),\
    name      TEXT UNIQUE,\
    value     TEXT\
    );",
  );
  await execQuery(
    "CREATE TABLE IF NOT EXISTS image_serve_events (\
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\
    served_at timestamptz NOT NULL DEFAULT now(),\
    file_id uuid NOT NULL,\
    file_path text NOT NULL,\
    artist text,\
    rating text NOT NULL CHECK (rating IN ('sfw', 'nsfw'))\
);",
  );
  await execQuery(
    "CREATE INDEX IF NOT EXISTS idx_image_serve_events_served_at ON image_serve_events (served_at DESC);",
  );
  await execQuery(
    "CREATE INDEX IF NOT EXISTS idx_image_serve_events_rating_served_at ON image_serve_events (rating, served_at DESC);",
  );
  await execQuery(
    "CREATE INDEX IF NOT EXISTS idx_image_serve_events_file_id ON image_serve_events (file_id);",
  );
  await execQuery(
    "CREATE INDEX IF NOT EXISTS idx_image_serve_events_artist ON image_serve_events (artist);",
  );
  await execQuery(
    "COMMENT ON TABLE image_serve_events IS 'Historical image serve events for /img/random. artist is intentionally a snapshot captured at serve time and is not a live lookup into display_files.';",
  );
  await execQuery(
    "INSERT INTO metadata (name, value)\
    VALUES ('currentRating', 'sfw') \
    ON CONFLICT (name) DO NOTHING;",
  );
}
