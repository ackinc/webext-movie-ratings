import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { differenceInDays, isValid, parseISO } from "date-fns";
import zlib from "node:zlib";
import { downloadedImdbDataExpiryInDays } from "./constants.ts";
import logger from "./logger.ts";
import { downloadFile, isError } from "./utils.ts";

const dataFileUrls = [
  "https://datasets.imdbws.com/title.basics.tsv.gz",
  "https://datasets.imdbws.com/title.akas.tsv.gz",
];

export async function refreshImdbDataIfStale(imdbDataDir: string) {
  if (!(await checkIfStale(imdbDataDir))) {
    logger.info(`refreshImdbDataIfStale: found fresh data.`);
    return;
  }

  logger.info(`refreshImdbDataIfStale: found missing/stale data.`);

  await Promise.all(
    dataFileUrls.map((url) =>
      downloadFile(
        url,
        path.join(imdbDataDir, path.basename(url, path.extname(url))),
        zlib.createGunzip(),
      ),
    ),
  );

  const metaFilePath = path.join(imdbDataDir, "meta.json");
  await writeFile(
    metaFilePath,
    JSON.stringify({ lastUpdatedAt: new Date().toISOString() }),
  );
  logger.info(`refreshImdbDataIfStale: refreshed IMDB data.`);

  return true;
}

async function checkIfStale(imdbDataDir: string) {
  let lastUpdatedAt: Date | null = null;

  try {
    const metaFilePath = path.join(imdbDataDir, "meta.json");
    const metadata = await readFile(metaFilePath, { encoding: "utf-8" });
    lastUpdatedAt = parseISO(JSON.parse(metadata)["lastUpdatedAt"]);
  } catch (e) {
    if (isError(e) && e["code"] === "ENOENT") {
      // do nothing
    } else {
      logger.error(e);
    }
  }

  if (
    lastUpdatedAt &&
    isValid(lastUpdatedAt) &&
    differenceInDays(new Date(), lastUpdatedAt) < downloadedImdbDataExpiryInDays
  ) {
    return false;
  }

  return true;
}
