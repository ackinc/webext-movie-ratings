#!/usr/bin/env node

// This script updates the values in titles.meta to match
//   what's described in NOTE_PROGRAM_MATCH_RECORD_META_VALUE

// It only updates rows where the match-status 'abandoned' or 'matched',
//   and is meant to be run before we deploy the api-server change
//   that starts putting 'reportedIncorrect' statuses in the db

import "dotenv/config";
import { fileURLToPath } from "node:url";
import { pick } from "siftutils";
import { mapLimit } from "async";
import Database, { type Database as TDatabase } from "better-sqlite3";
import { default as baseLogger } from "../services/logger.ts";
import { querySearchEngine } from "../services/searchEngineService.ts";
import type { RawProgramMatchRecord } from "../types.ts";

// if this is too high and the search engine cannot keep up, queries will start
//   failing with 408 request timeout errors
const MAX_PARALLEL_SEARCH_QUERIES = 50;
const MAX_RESULTS_FROM_SEARCH_QUERY = 10;

const env = pick(process.env, ["DB_PATH"], true);
const logger = baseLogger.child({ script: fileURLToPath(import.meta.url) });

const db: TDatabase = new Database(env.DB_PATH);
db.pragma("journal_mode = WAL");

const { changes } = db
  .prepare(
    `
  UPDATE titles
  SET matchedBy = 'system', meta = '{}'
  WHERE status = 'abandoned'
    AND (matchedBy != 'system' OR meta != '{}')
`,
  )
  .run();
logger.info(`Updated ${changes} 'abandoned' rows`);

const matchedRecordsFromDb = db
  .prepare<
    never[],
    RawProgramMatchRecord
  >("SELECT * FROM titles WHERE status = 'matched' AND meta ->> 'bestMatch' IS NULL")
  .all();
logger.info(
  `Found ${matchedRecordsFromDb.length} 'matched' rows that need updating`,
);

const preparedStmt = db.prepare(`UPDATE titles SET meta = ? WHERE id = ?`);
await mapLimit(
  matchedRecordsFromDb,
  MAX_PARALLEL_SEARCH_QUERIES,
  updateMetaValue,
);

// helpers

async function updateMetaValue(row: RawProgramMatchRecord) {
  const query = {
    title: row.title,
    type: row.type === "\\N" ? null : row.type,
    year: row.year === 0 ? null : row.year,
  };
  const matches = await querySearchEngine(query, MAX_RESULTS_FROM_SEARCH_QUERY);
  const bestMatch = matches.find((m) => m.imdbId === row.imdbId);
  if (!bestMatch) {
    logger.warn(
      `Row with id ${row.id} has imdbId ${row.imdbId}, but search results have imdbIds: ${matches.map((m) => m.imdbId).join(", ")}`,
    );
  } else {
    preparedStmt.run(JSON.stringify({ bestMatch }), row.id);
  }
}
