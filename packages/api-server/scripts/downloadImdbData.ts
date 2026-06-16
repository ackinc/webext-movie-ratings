#!/usr/bin/env node

import "dotenv/config";

// initialize Sentry
import "../instrument.ts";

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { ensureDir } from "fs-extra";
import { pick } from "siftutils";
import { downloadFile } from "siftnodeutils";
import { imdbDataFileUrls } from "../constants.ts";
import baseLogger from "../logger.ts";

const __filename = path.basename(fileURLToPath(import.meta.url));

const { IMDB_DATA_DIR } = pick(process.env, ["IMDB_DATA_DIR"], true);

await ensureDir(IMDB_DATA_DIR!);

const logger = baseLogger.child({ script: __filename });
const startTime = new Date();
await Promise.all(
  imdbDataFileUrls.map((url) =>
    downloadFile(
      url,
      path.join(IMDB_DATA_DIR!, path.basename(url, path.extname(url))),
      zlib.createGunzip(),
    ),
  ),
);
const durationMs = +new Date() - +startTime;
logger.info(`Completed in (${durationMs}ms)`);
