import "dotenv/config";
import Database from "better-sqlite3";
import cron from "node-cron";
import { createServer } from "./server.ts";
import { refreshImdbData } from "./imdbDataUtils/index.ts";

const { DB_PATH, IMDB_DATA_DIR, PORT } = process.env;

const db = new Database(DB_PATH!, { fileMustExist: true });
db.pragma("journal_mode = WAL");

if (process.env["APP_ENV"] === "production") {
  cron.schedule(
    "0 0 1,16 * *", // twice a month
    () => refreshImdbData(IMDB_DATA_DIR!),
  );
}

const server = createServer(db);
server.listen({ port: +PORT! }, function (err, _address) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});

process.on("exit", () => db.close());
