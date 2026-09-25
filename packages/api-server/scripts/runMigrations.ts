#!/usr/bin/env node

// TODO: error reporting to Sentry

import Database, { type Database as TDatabase } from "better-sqlite3";
import { pick } from "siftutils";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import baseLogger from "../logger.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const env = pick(process.env, ["DB_PATH"], true);
const logger = baseLogger.child({ script: __filename });
const migrationsDirpath = path.join(__dirname, "../migrations");

const db: TDatabase = new Database(env.DB_PATH);
db.pragma("journal_mode = WAL");

const lastMigration = getLastMigration();
logger.debug(`lastMigration: ${lastMigration || "<NONE>"}`);

const migrationsToRun = fs
  .readdirSync(migrationsDirpath, { encoding: "utf-8" })
  .sort()
  .filter((m) => m > (lastMigration ?? ""));
logger.debug(`Pending migrations: ${migrationsToRun.length}`);

migrationsToRun.forEach(runMigration);
logger.debug(`runMigrations finished without errors`);

// helpers

function getLastMigration(): string | null {
  const result = db
    .prepare(
      `SELECT * FROM sqlite_master WHERE type = 'table' AND name = 'migrations'`,
    )
    .get();
  if (!result) return null;

  return (
    db
      .prepare<
        string[],
        { id: string }
      >(`SELECT id FROM migrations WHERE status = ? ORDER BY updatedAt DESC`)
      .get("success")?.id ?? null
  );
}

function runMigration(filename: string) {
  try {
    const filepath = path.join(migrationsDirpath, filename);
    const stmts = fs.readFileSync(filepath, { encoding: "utf-8" });
    db.exec(`
      BEGIN;
      ${stmts}
      INSERT OR REPLACE INTO migrations (id) VALUES ('${filename}');
      COMMIT;
    `);
    logger.debug(`Finished running migration ${filename}`);
  } catch (e) {
    db.prepare(
      `INSERT OR REPLACE INTO migrations (id, status) VALUES (?, ?)`,
    ).run(filename, `Error: ${(e as Error).message}`);
    throw new Error(`Error running migration ${filename}`, { cause: e });
  }
}
