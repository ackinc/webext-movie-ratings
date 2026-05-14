import "dotenv/config";

// initialize Sentry
import "./instrument.ts";

import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import cron from "node-cron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

cron.schedule(
  "0 1 * * *", // every day
  () =>
    spawn("node", [path.join(__dirname, "./scripts/backupDatabase.ts")], {
      detached: true,
      stdio: "inherit",
    }).unref(),
);

cron.schedule(
  "0 0 1,16 * *", // twice a month
  () =>
    spawn("node", [path.join(__dirname, "./scripts/refreshImdbData.ts")], {
      // we don't want this process to be interrupted if the server is restarting
      detached: true,
      stdio: "inherit",
    }).unref(), // we don't want the server to wait until this process is done before closing
);
