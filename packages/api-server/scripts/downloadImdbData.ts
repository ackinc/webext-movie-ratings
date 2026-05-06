#!/usr/bin/env node

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { ensureDir } from "fs-extra";
import { downloadFile } from "siftnodeutils";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { imdbDataFileUrls } from "../constants.ts";
import baseLogger from "../logger.ts";

const __filename = path.basename(fileURLToPath(import.meta.url));

const argv = yargs(hideBin(process.argv))
  .option("imdbDataDir", { string: true, demandOption: true })
  .parseSync();
const imdbDataDir = path.resolve(argv.imdbDataDir);

await ensureDir(imdbDataDir);

const logger = baseLogger.child({ script: __filename });
const startTime = new Date();
await Promise.all(
  imdbDataFileUrls.map((url) =>
    downloadFile(
      url,
      path.join(imdbDataDir, path.basename(url, path.extname(url))),
      zlib.createGunzip(),
    ),
  ),
);
const durationMs = +new Date() - +startTime;
logger.info(`Completed in (${durationMs}ms)`);
