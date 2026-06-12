import { execSync } from "node:child_process";
import * as fs from "node:fs";
import readline from "node:readline";
import type { Logger } from "pino";

export type ImdbId = string;

export type LineNumber = number;
export type Line = string;
export type Batch = [LineNumber, Line][];
export async function processFile(
  filepath: string,
  processFn: (batch: Batch) => Promise<void>,
  filterFn?: (line: string, lineNum: number) => boolean,
  {
    batchSize = 1,
    logger,
    logProgressEveryNLines = 1000,
    maxLinesToProcess = Infinity,
    haltFn = () => false,
  }: {
    batchSize?: number;
    logger?: Logger;
    logProgressEveryNLines?: number;
    maxLinesToProcess?: number;
    haltFn?: (line: string, lineNum: number) => boolean;
  } = {},
) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filepath, { encoding: "utf-8" }),
  });

  let headerSkipped = false;
  let lineNum = 0;
  let startTime = new Date();
  let batch: Batch = [];
  for await (const line of rl) {
    if (!headerSkipped) {
      headerSkipped = true;
      continue;
    }

    if (++lineNum >= maxLinesToProcess) break;
    if (haltFn && haltFn(line, lineNum)) break;

    if (!filterFn || filterFn(line, lineNum)) {
      batch.push([lineNum, line]);

      if (batch.length === batchSize) {
        await processFn(batch);
        batch = [];
      }
    }

    if (lineNum % logProgressEveryNLines === 0) {
      const now = new Date();
      const durationMs = +now - +startTime;
      const msg = `Processed ${lineNum} lines of ${filepath} (${durationMs}ms) ...`;
      logger ? logger.info(msg) : console.log(msg);
      startTime = now;
    }
  }
  if (batch.length > 0) await processFn(batch);
}

export function checkColnames(
  filepath: string,
  expectedColnames: (string | null)[],
): void {
  const colnames = execSync(`head -n1 ${filepath}`)
    .toString()
    .trim()
    .split("\t");

  for (let i = 0; i < expectedColnames.length; i++) {
    if (expectedColnames[i] && colnames[i] !== expectedColnames[i]) {
      throw new Error(
        `Colname ${i} of ${filepath} is ${colnames[i]} but expected ${expectedColnames[i]}`,
      );
    }
  }
}

export function isMovieOrSeries(line: string): boolean {
  const type = line.split("\t")[1];
  return Boolean(
    type &&
    ["movie", "tvSeries", "tvMovie", "tvMiniSeries", "tvPilot"].includes(type),
  );
}
