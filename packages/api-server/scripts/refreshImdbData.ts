#!/usr/bin/env node

import "dotenv/config";

// initialize Sentry
import "../instrument.ts";

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { pick } from "siftutils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { IMDB_DATA_DIR } = pick(process.env, ["IMDB_DATA_DIR"], true);

execFileSync(path.join(__dirname, "downloadImdbData.ts"), { stdio: "inherit" });
execFileSync(path.join(__dirname, "addImdbDataToMeilisearch.ts"), {
  stdio: "inherit",
});
fs.readdirSync(IMDB_DATA_DIR!).map((filename) =>
  fs.unlinkSync(path.join(IMDB_DATA_DIR!, filename)),
);
