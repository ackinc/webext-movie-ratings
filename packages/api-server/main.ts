import "dotenv/config";
import cron from "node-cron";
import { initDb } from "./db.ts";
import logger from "./logger.ts";
import { createServer } from "./server.ts";
import { refreshImdbData } from "./helpers.ts";

const { IMDB_DATA_DIR, PORT } = process.env;

const db = initDb();

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

process.on("SIGINT", cleanup);

function cleanup() {
  logger.info("Received SIGINT. Exiting ...");
  server.close();
  db.close();
  process.exit(0);
}
