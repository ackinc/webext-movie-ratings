import * as path from "node:path";
import { spawn } from "node:child_process";
import zlib from "node:zlib";
import { mapLimit } from "async";
import { type Database } from "better-sqlite3";
import { type Index } from "meilisearch";
import {
  imdbDataFileUrls,
  imdbTitleMatchingMinimumRankingScore,
} from "./constants.ts";
import logger from "./logger.ts";
import { type IndexedImdbTitle, type ProgramMatchRecord } from "./types.ts";
import { downloadFile } from "./utils.ts";

export async function refreshImdbData(imdbDataDir: string) {
  // download files
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
  logger.info(`refreshImdbDataIfStale: refreshed data (${durationMs}ms)`);

  // import into search engine
  return new Promise<void>((resolve, reject) => {
    const importScriptName = "addToMeilisearch.ts";
    const importScriptPath = path.normalize(
      path.join(__dirname, "imdbDataUtils", importScriptName),
    );

    const startTime = new Date();
    const cp = spawn("node", [importScriptPath], { stdio: "pipe" });
    const cpLogger = logger.child({ module: path.basename(importScriptPath) });
    cp.on("close", (code, signal) => {
      const durationMs = +new Date() - +startTime;
      if (code === 0) {
        cpLogger.info({ msg: `exited successfully`, code, signal, durationMs });
        resolve();
      } else {
        cpLogger.warn({
          msg: `exited unsuccessfully`,
          code,
          signal,
          durationMs,
        });
        const err = new Error(
          `${importScriptName} exited with ${code === null ? "signal" : "code"} ${code ?? signal}`,
        );
        reject(err);
      }
    });
    cp.on("error", (err) => {
      cpLogger.error(err);
      reject(err);
    });
    cp.stdout.on("data", (data) => cpLogger.info(data));
    cp.stderr.on("data", (data) => cpLogger.error(data));
  });
}

export async function matchTitlesToImdbIds(db: Database, index: Index) {
  const dbRecords = db
    .prepare(`SELECT * FROM titles WHERE status = ? LIMIT 1000`)
    .all("pending") as ProgramMatchRecord[];
  await mapLimit(dbRecords, 10, attemptMatch);

  async function attemptMatch(dbRecord: ProgramMatchRecord): Promise<void> {
    let { hits: searchResults } = await index.search<IndexedImdbTitle>(
      dbRecord.title,
      {
        limit: 5,
        rankingScoreThreshold: imdbTitleMatchingMinimumRankingScore,
      },
    );
    searchResults = searchResults.filter(
      ({ type, year }) =>
        (type === dbRecord.type || dbRecord.type === "\\N") &&
        (year === dbRecord.year || dbRecord.year === 0),
    );
    const bestMatch = searchResults[0];

    if (bestMatch) {
      db.prepare(
        `UPDATE titles SET status = ?, "imdbId" = ?  WHERE id = ?`,
      ).run("matched", bestMatch.imdbId, dbRecord.id);
    } else {
      db.prepare(`UPDATE titles SET status = ? WHERE id = ?`).run(
        "abandoned",
        dbRecord.id,
      );
    }
  }
}
