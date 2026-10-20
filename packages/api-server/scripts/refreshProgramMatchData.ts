#!/usr/bin/env node

// This script only updates rows where the match-status 'abandoned' or
//   'matched', since rows where the status is 'reportedIncorrect' require
//   manual intervention currently

// This script also updates the values in titles.meta to match
//   what's described in NOTE_PROGRAM_MATCH_RECORD_META_VALUE

import "dotenv/config";
import { pick } from "siftutils";
import Database, { type Database as TDatabase } from "better-sqlite3";
import logger from "../services/logger.ts";
import { querySearchEngine } from "../services/searchEngineService.ts";
import type { RawProgramMatchRecord } from "../types.ts";

// if this is too high and the search engine cannot keep up, queries will start
//   failing with 408 request timeout errors
const MAX_CONCURRENCY = 50;
const MAX_RESULTS_FROM_SEARCH_QUERY = 10;

const env = pick(process.env, ["DB_PATH"], true);

const db: TDatabase = new Database(env.DB_PATH);
db.pragma("journal_mode = WAL");

let curOffset = 0;
let nRowsProcessed = 0;
let rows: RawProgramMatchRecord[] = [];
const preparedStmt = db.prepare<
  ["matched" | "abandoned", string | null, string, number]
>(`UPDATE titles SET status = ?, imdbId = ?, meta = ? WHERE id = ?`);
do {
  rows = db
    .prepare<never[], RawProgramMatchRecord>(
      `SELECT * FROM titles
      WHERE status IN ('matched', 'abandoned')
      LIMIT ${MAX_CONCURRENCY}
      OFFSET ${curOffset}`,
    )
    .all();
  if (rows.length === 0) break;
  await Promise.all(rows.map(updateMatch));

  nRowsProcessed += rows.length;
  curOffset += MAX_CONCURRENCY;

  logger.info(`Processed ${nRowsProcessed} rows`);
} while (true);

logger.info(`Done`);

// helpers

async function updateMatch(row: RawProgramMatchRecord) {
  const query = {
    title: row.title,
    type: row.type === "\\N" ? null : row.type,
    year: row.year === 0 ? null : row.year,
  };
  const [bestMatch] = await querySearchEngine(
    query,
    MAX_RESULTS_FROM_SEARCH_QUERY,
  );

  if (!bestMatch) {
    preparedStmt.run("abandoned", null, "{}", row.id);
    if (row.imdbId) {
      logger.info(`rowId[${row.id}]: ${row.imdbId} -> null`);
    }
    return;
  }

  preparedStmt.run(
    "matched",
    bestMatch.imdbId,
    JSON.stringify({ bestMatch }),
    row.id,
  );
  if (bestMatch.imdbId !== row.imdbId) {
    logger.info(`rowId[${row.id}]: ${row.imdbId} -> ${bestMatch.imdbId}`);
  }
}
