import "dotenv/config";
import Database from "better-sqlite3";
import cron from "node-cron";
import { Meilisearch } from "meilisearch";
import { createServer } from "./server.ts";
import { matchTitlesToImdbIds, refreshImdbData } from "./helpers.ts";

const {
  DB_PATH,
  IMDB_DATA_DIR,
  MEILISEARCH_MASTER_KEY,
  MEILISEARCH_URL,
  PORT,
} = process.env;

const db = new Database(DB_PATH!, { fileMustExist: true });
db.pragma("journal_mode = WAL");

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = client.index("imdb");

if (process.env["APP_ENV"] === "production") {
  cron.schedule(
    "0 0 1,16 * *", // twice a month
    () => refreshImdbData(IMDB_DATA_DIR!),
  );
}

cron.schedule(
  "0,15,30,45 * * * *", // every 15 mins
  () => matchTitlesToImdbIds(db, index),
);

const server = createServer(db);
server.listen({ port: +PORT! }, function (err, _address) {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
});

process.on("exit", () => db.close());
