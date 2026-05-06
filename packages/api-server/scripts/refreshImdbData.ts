#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { IMDB_DATA_DIR } = process.env;

if (!IMDB_DATA_DIR) throw new Error(`IMDB_DATA_DIR not in env`);

execFileSync(
  path.join(__dirname, "downloadImdbData.ts"),
  [`--imdbDataDir=${IMDB_DATA_DIR}`],
  { stdio: "inherit" },
);
execFileSync(
  path.join(__dirname, "addImdbDataToMeilisearch.ts"),
  [`--imdbDataDir=${IMDB_DATA_DIR}`],
  { stdio: "inherit" },
);
