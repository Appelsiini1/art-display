import sqlite3, { Database } from "sqlite3";
import path from "node:path";
import { displayFile, metadataRow } from "../models/types";

function _objectToArrayDF(obj: displayFile): Array<number | string> {
  return [obj.artist, obj.path, obj.type, obj.rating];
}

function _openDB(): Promise<sqlite3.Database> {
  const dbPath = path.join("database", "database.db");
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error in _openDB():", err.message);
        reject(err);
      } else {
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
    console.error(err.stack);
    throw err;
  }
}

export async function initDatabase() {
  return _execOperationDB(async (db: Database) => {
    const queries = [
      `CREATE TABLE IF NOT EXISTS displayFiles (
        id INTEGER PRIMARY KEY,
        artist TEXT,
        path TEXT NOT NULL,
        type TEXT NOT NULL,  
        rating TEXT NOT NULL
    )`,
      `CREATE TABLE IF NOT EXISTS metadata (
        id TEXT PRIMARY KEY,
        value TEXT
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

export async function getRandomDisplayFile(
  rating: "all" | string = "all"
): Promise<displayFile> {
  return _execOperationDB(async (db: Database) => {
    let query = "SELECT * FROM displayFiles ";

    switch (rating) {
      case "sfw":
        query += 'WHERE rating="sfw" AND';
        break;
      case "nsfw":
        query += 'WHERE rating="nsfw" AND';
        break;

      case "all":
        query += 'WHERE (rating="sfw" OR rating="nsfw") AND';
        break;

      default:
        query += "WHERE";
        break;
    }
    query +=
      " id > (ABS(RANDOM()) % (SELECT max(id) FROM displayFiles)) LIMIT 1";

    return new Promise(async (resolve, reject) => {
      let round = 1;
      let row = undefined;
      while (1) {
        row = await getFileFromDB(query, db);
        if (!row) {
          round += 1;
          console.warn(
            `getRandomDisplayFile(): Row was undefined, starting round ${round}.`
          );
        } else {
          break;
        }
      }
      // @ts-ignore
      resolve(row);
    });
  });
}

async function getFileFromDB(
  query: string,
  db: Database
): Promise<displayFile> {
  return new Promise((resolve, reject) => {
    db.get(query, (err: Error, row: displayFile) => {
      if (err) {
        console.error("Error in getFileFromDB():", err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

export async function getDisplayFile(
  id: number
): Promise<displayFile | number> {
  return _execOperationDB(async (db: Database) => {
    const query = `SELECT * FROM displayFiles WHERE id=(?)`;

    return new Promise((resolve, reject) => {
      db.get(query, [id], (err: Error, row: displayFile) => {
        if (err) {
          console.error("Error in getDisplayFile():", err.message);
          reject(err);
        } else if (row == undefined) {
          resolve(-1);
        }
        resolve(row);
      });
    });
  });
}

export async function getMaxDisplayFileID(): Promise<number> {
  return _execOperationDB(async (db: Database) => {
    const query = `SELECT MAX(id) FROM displayFiles`;

    return new Promise((resolve, reject) => {
      db.get(query, (err: Error, row: { id: number }) => {
        if (err) {
          console.error("Error in getMaxDisplayFileID():", err.message);
          reject(err);
        } else if (row == undefined) {
          reject(
            new Error(
              `Something went wrong while fetching max display file ID.`
            )
          );
        }
        resolve(row.id);
      });
    });
  });
}

export async function getMetadataValue(id: string) {
  return _execOperationDB(async (db: Database) => {
    const query = `SELECT value FROM metadata WHERE id=(?)`;

    return new Promise<metadataRow>((resolve, reject) => {
      db.get(query, [id], (err: Error, row: metadataRow) => {
        if (err) {
          console.error("Error in getMetadataValue():", err.message);
          reject(err);
        }
        resolve(row);
      });
    });
  });
}

export async function addDisplayFileToDB(file: displayFile): Promise<null> {
  return _execOperationDB(async (db: Database) => {
    const query = `INSERT INTO displayFiles(artist, path, type, rating) VALUES(?,?,?,?)`;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const parameters = _objectToArrayDF(file);
        db.run(query, parameters, (err) => {
          if (err) {
            console.error("Error inserting new row to displayFiles table!");
            reject(err);
          }
          resolve(null);
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
    const query = `UPDATE metadata SET value=(?) WHERE id=(?)`;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(query, [value, id], (err) => {
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

export async function updateDisplayFilesToDB(file: displayFile): Promise<null> {
  return _execOperationDB(async (db: Database) => {
    const query = `UPDATE displayFiles SET artist="${file.artist}", path="${file.path}", type="${file.type}", rating="${file.rating}" WHERE id=${file.id}`;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(query, (err) => {
          if (err) {
            console.error(
              `Error updating row ${file.id} to displayFiles table!`
            );
            reject(err);
          }
          resolve(null);
        });
      });
    });
  });
}
