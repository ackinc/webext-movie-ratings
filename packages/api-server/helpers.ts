import * as path from "node:path";
import { spawn } from "node:child_process";
import zlib from "node:zlib";
import type { Database } from "better-sqlite3";
import { downloadFile } from "siftnodeutils";
import { type SiftApiProgramMatching } from "sifttypes";
import { imdbDataFileUrls } from "./constants.ts";
import logger from "./logger.ts";
import type { ProgramMatchRecord } from "./types.ts";

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
    const importScriptName = "addImdbDatasetToMeilisearch.ts";
    const importScriptPath = path.normalize(
      path.join(__dirname, "scripts", importScriptName),
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

export function getProgramMatchRecord(
  db: Database,
  idOrProgram: number | bigint | SiftApiProgramMatching.Request,
): ProgramMatchRecord | undefined {
  let row: ProgramMatchRecord | undefined;
  if (typeof idOrProgram === "number" || typeof idOrProgram === "bigint") {
    row = db.prepare(`SELECT * FROM titles WHERE id = ?`).get(idOrProgram) as
      | ProgramMatchRecord
      | undefined;
  } else {
    row = db
      .prepare(
        `SELECT * FROM titles WHERE title = $title
        ${"type" in idOrProgram ? " AND type = $type " : ""}
        ${"year" in idOrProgram ? " AND year = $year " : ""}`,
      )
      .get(idOrProgram) as ProgramMatchRecord | undefined;
  }

  if (row) {
    // makes future parseISO calls treat the string as representing
    //   a UTC date, instead of a date in the current system timezone
    row.createdAt = row.createdAt.replace(" ", "T") + "Z";
    row.updatedAt = row.updatedAt.replace(" ", "T") + "Z";
  }

  return row;
}

export function createProgramMatchRecord(
  db: Database,
  data: Partial<
    Omit<ProgramMatchRecord, "id" | "title" | "createdAt" | "updatedAt">
  > &
    Pick<ProgramMatchRecord, "title">,
) {
  const entries = Object.entries(data);
  if (entries.length === 0) throw new Error("data arg cannot be empty object");
  return db
    .prepare(
      `INSERT INTO titles (${entries.map(([col]) => `"${col}"`).join(", ")})
      VALUES (${new Array(entries.length).fill("?").join(", ")})
      ON CONFLICT DO NOTHING`,
    )
    .run(...entries.map(([, val]) => val));
}

export function updateProgramMatchRecord(
  db: Database,
  rowId: number | bigint,
  data: Partial<Omit<ProgramMatchRecord, "id" | "createdAt" | "updatedAt">>,
) {
  const entries = Object.entries(data);
  if (entries.length === 0) return;
  return db
    .prepare(
      `UPDATE titles SET ${entries.map(([col]) => `${col} = ?`).join(", ")}
      WHERE id = ?`,
    )
    .run(...entries.map(([, val]) => val), rowId);
}
