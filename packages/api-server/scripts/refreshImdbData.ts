#!/usr/bin/env node

import "dotenv/config";

// initialize Sentry
import "../instrument.ts";

import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

execFileSync(path.join(__dirname, "downloadImdbData.ts"), { stdio: "inherit" });
execFileSync(path.join(__dirname, "addImdbDataToMeilisearch.ts"), {
  stdio: "inherit",
});
