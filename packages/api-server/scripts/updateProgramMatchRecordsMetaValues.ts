#!/usr/bin/env node

// This script updates the values in titles.meta to match
//   what's described in NOTE_PROGRAM_MATCH_RECORD_META_VALUE

// It only updates rows where the match-status 'abandoned' or 'matched',
//   and is meant to be run before we deploy the api-server change
//   that starts putting 'reportedIncorrect' statuses in the db

import "dotenv/config";
import { fileURLToPath } from "node:url";
import type { IndexedImdbTitle } from "siftcore";
import { pick } from "siftutils";
import Database, { type Database as TDatabase } from "better-sqlite3";
import { default as baseLogger } from "../logger.ts";
import { querySearchEngine } from "../searchEngine.ts";
import type { RawProgramMatchRecord } from "../types.ts";

const env = pick(process.env, ["DB_PATH"], true);
const logger = baseLogger.child({ script: fileURLToPath(import.meta.url) });

const db: TDatabase = new Database(env.DB_PATH);
db.pragma("journal_mode = WAL");

const matchedTitles = db
  .prepare<
    never[],
    RawProgramMatchRecord
  >("SELECT * FROM titles WHERE status = 'matched' AND meta ->> 'bestMatch' IS NULL")
  .all();

const bestMatches = await Promise.all(matchedTitles.map(getBestMatch));

const preparedStmt = db.prepare(`UPDATE titles SET meta = ? WHERE id = ?`);
db.transaction(() => {
  db.exec("UPDATE titles SET meta = NULL WHERE status = 'abandoned'");
  matchedTitles.forEach(({ id }, idx) => {
    const bestMatch = bestMatches[idx];
    if (bestMatch) preparedStmt.run(JSON.stringify({ bestMatch }), id);
  });
});

async function getBestMatch(
  row: RawProgramMatchRecord,
): Promise<IndexedImdbTitle | undefined> {
  const query = {
    title: row.title,
    type: row.type === "\\N" ? null : row.type,
    year: row.year === 0 ? null : row.year,
  };
  const matches = await querySearchEngine(query);
  const bm = matches.find((m) => m.imdbId === row.imdbId);
  if (!bm) {
    logger.warn(`no search results for matched title record ${row.id}`);
  }
  return bm;
}
