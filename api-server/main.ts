import "dotenv/config";
import Database from "better-sqlite3";
import cron from "node-cron";
import { createServer } from "./server.ts";
import { refreshImdbDataIfStale } from "./dataRefresh.ts";

const db = new Database(process.env["DB_PATH"], { fileMustExist: true });
db.pragma("journal_mode = WAL");

if (process.env["APP_ENV"] === "production") {
  cron.schedule(
    "0 0 * * *", // top of every day
    () => refreshImdbDataIfStale(process.env["IMDB_DATA_DIR"]!),
  );
}

const server = createServer(db);
server.listen({ port: +process.env["PORT"]! }, function (err, _address) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});

process.on("exit", () => db.close());
