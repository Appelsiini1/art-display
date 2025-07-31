import sqlite3, { Database } from "sqlite3";
import path from "node:path";

interface displayFile {
  id: number;
  artist: string;
  file: string;
  path: string;
  type: string;
  rating: "sfw" | "nsfw";
}

interface displayFileDB extends Omit<displayFile, "rating"> {
  rating: number; // 0 SFW, 1 NSFW
}

interface metadataRow {
  id: string;
  value: string;
}

function _objectToArrayDF(obj: displayFile): Array<number | string> {
  return [obj.artist, obj.file, obj.path, obj.type, obj.rating];
}

function _openDB(): Promise<sqlite3.Database> {
  const dbPath = path.join("../", "database", "database.db");
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error in _openDB():", err.message);
        reject(err);
      } else {
        //log.info("Connected to the database.");
        resolve(db);
      }
    });
  });
}

async function _closeDB(db: sqlite3.Database): Promise<string> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error("Error in _closeDB():", err.message);
        reject(err);
      }
      //log.info("Closed the database connection.");
      resolve("Closed the database connection.");
    });
  });
}

async function _execOperationDB<T>(
  operation: (db: sqlite3.Database) => Promise<T>
): Promise<T> {
  let db: sqlite3.Database;
  try {
    db = await _openDB();
    const result = await operation(db);
    await _closeDB(db);

    return result;
  } catch (err: any) {
    console.error("Error in _execOperationDB():", err.message);
    throw err;
  }
}

export async function initDatabase() {
  return _execOperationDB(async (db: Database) => {
    const queries = [
      `CREATE TABLE IF NOT EXISTS displayFiles (
        id INTEGER PRIMARY KEY,
        artist TEXT,
        file TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT NOT NULL,  
        rating TEXT NOT NULL,
    )`,
      `CREATE TABLE IF NOT EXISTS metadata (
        id TEXT PRIMARY KEY,
        value TEXT,
    )`,
    ];
    await Promise.all(
      queries.map((query) =>
        db.serialize(() => {
          db.run(query, (err: Error) => {
            if (err) {
              console.error("Error in initDB():", err.message);
              throw err;
            }
          });
        })
      )
    );
  });
}

export async function getDisplayFile(id: number): Promise<displayFile> {
  return _execOperationDB(async (db: Database) => {
    const query = `SELECT * FROM displayFiles WHERE id=${id}`;

    return new Promise((resolve, reject) => {
      db.get(query, (err: Error, row: displayFileDB) => {
        if (err) {
          console.error("Error in getDisplayFile():", err.message);
          reject(err);
        } else if (row == undefined) {
          reject(new Error(`File with '${id}' not found in the database.`));
        }
        resolve({
          ...row,
          rating: row.rating ? "nsfw" : "sfw",
        });
      });
    });
  });
}

export async function getMetadataValue(id: string) {
  return _execOperationDB(async (db: Database) => {
    const query = `SELECT * FROM metadata WHERE id=${id}`;

    return new Promise((resolve, reject) => {
      db.get(query, (err: Error, row: metadataRow) => {
        if (err) {
          console.error("Error in getMetadataValue():", err.message);
          reject(err);
        } else if (row == undefined) {
          reject(new Error(`Metadata with '${id}' not found in the database.`));
        }
        resolve(row);
      });
    });
  });
}

export async function addDisplayFilesToDB(
  files: Array<displayFile>
): Promise<null> {
  return _execOperationDB(async (db: Database) => {
    const query = `INSERT INTO displayFiles(artist, file, path, type, rating) VALUES(?,?,?,?,?)`;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        files.forEach((value) => {
          db.run(query, _objectToArrayDF(value), (err) => {
            if (err) {
              console.error("Error inserting new row to displayFiles table!");
              reject(err);
            }
            resolve(null);
          });
        });
      });
    });
  });
}

export async function addMetadataValueDB(
  id: string,
  value: string
): Promise<null> {
  return _execOperationDB(async (db: Database) => {
    const query = `INSERT INTO metadata(id, value) VALUES(?,?)`;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(query, [id, value], (err) => {
          if (err) {
            console.error("Error inserting new row to metadata table!");
            reject(err);
          }
          resolve(null);
        });
      });
    });
  });
}

export async function updateMetadataValueDB(
  id: string,
  value: string
): Promise<null> {
  return _execOperationDB(async (db: Database) => {
    const query = `UPDATE metadata SET value=${value} WHERE id=${id}`;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(query, [id, value], (err) => {
          if (err) {
            console.error(
              `Error updating row with id ${id} to metadata table!`
            );
            reject(err);
          }
          resolve(null);
        });
      });
    });
  });
}
