#!/usr/bin/env node

import "../instrument.ts";

import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { pick } from "siftutils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { IMDB_DATA_DIR } = pick(process.env, ["IMDB_DATA_DIR"], true);

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
