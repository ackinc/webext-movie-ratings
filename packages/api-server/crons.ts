import "dotenv/config";

// initialize Sentry
import "./instrument.ts";

import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import cron from "node-cron";
import { pick } from "siftutils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = pick(process.env, ["IMDB_DATA_DIR"], true);

cron.schedule(
  "0 0 1,16 * *", // twice a month
  () =>
    spawn("node", [path.join(__dirname, "./scripts/refreshImdbData.ts")], {
      // we don't want this process to be interrupted if the server is restarting
      detached: true,
      env: { IMDB_DATA_DIR: env.IMDB_DATA_DIR! },
      stdio: "inherit",
    }).unref(), // we don't want the server to wait until this process is done before closing
);

cron.schedule(
  "0 1 * * *", // every day
  () =>
    spawn("node", [path.join(__dirname, "./scripts/backupDatabase.ts")], {
      detached: true,
      stdio: "inherit",
    }).unref(),
);
