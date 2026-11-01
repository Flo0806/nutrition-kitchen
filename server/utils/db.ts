import { openDatabase, type Db } from "../db/open";

let db: Db | undefined;

/** The one database connection of the server. */
export function useDb() {
  db ??= openDatabase(serverConfig().databasePath);
  return db;
}
