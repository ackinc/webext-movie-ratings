import * as path from "node:path";
import zlib from "node:zlib";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import logger from "../logger.ts";
import { downloadFile } from "../utils.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFileUrls = [
  "https://datasets.imdbws.com/title.basics.tsv.gz",
  "https://datasets.imdbws.com/title.akas.tsv.gz",
];

export async function refreshImdbData(imdbDataDir: string) {
  // download files
  const startTime = new Date();
  await Promise.all(
    dataFileUrls.map((url) =>
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
      path.join(__dirname, importScriptName),
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
