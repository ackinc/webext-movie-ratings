import "dotenv/config";
import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import cron from "node-cron";
import { pick } from "siftutils";
import { initDb } from "./db.ts";
import logger from "./logger.ts";
import { createServer } from "./server.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = pick(process.env, ["IMDB_DATA_DIR", "PORT"], true);

const db = initDb();

if (process.env["APP_ENV"] === "production") {
  cron.schedule(
    "0 0 1,16 * *", // twice a month
    () =>
      spawn("node", [path.join(__dirname, "./scripts/refreshImdbData.ts")], {
        detached: true,
        env: { IMDB_DATA_DIR: env.IMDB_DATA_DIR! },
        stdio: "inherit",
      }).unref(),
  );
}

const server = createServer(db);
server.listen({ port: +env.PORT! }, function (err, _address) {
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
