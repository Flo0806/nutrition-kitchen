import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

/** Relative to the working directory; the Docker image copies the folder to the same place. */
export const migrationsFolder = "server/db/migrations";

/** Opens the database file, creating it on first start, and brings its schema up to date. */
export function openDatabase(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  // WAL lets readers go on while a recipe is saved; SQLite leaves foreign keys off unless asked.
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder });
  return db;
}

export type Db = ReturnType<typeof openDatabase>;
