import "dotenv/config";
import * as path from "node:path";
import Database, { type Database as TDatabase } from "better-sqlite3";
import { type Batch, processFile, isMovieOrSeries } from "./common.ts";

const { DB_PATH, IMDB_DATA_DIR } = process.env;
const BATCH_SIZE = 10000;

const db = new Database(DB_PATH!);
prepareDb(db);

const insertIntoImdbTitlesPreparedStmt = db.prepare(`
  INSERT INTO "imdbTitles" (id, title, type, year)
  VALUES (@id, @title, @type, @year)
  ON CONFLICT (id) DO NOTHING
`);
const insertIntoImdbTitlesTxn = db.transaction((records) => {
  for (const x of records) insertIntoImdbTitlesPreparedStmt.run(x);
});
const insertIntoImdbTitleAliasesPreparedStmt = db.prepare(`
  INSERT INTO "imdbTitleAliases" ("imdbId", "titleAlias", region, language)
  VALUES (@imdbId, @titleAlias, @region, @language)
  ON CONFLICT DO NOTHING
`);
const insertIntoImdbTitleAliasesTxn = db.transaction((records) => {
  for (const x of records) insertIntoImdbTitleAliasesPreparedStmt.run(x);
});

const imdbIds = new Set<string>();
await processFile(
  path.join(IMDB_DATA_DIR!, "title.basics.tsv"),
  async (batch: Batch) => {
    const imdbTitles = batch.map(([, line]) =>
      getImdbTitleFromBasicsFileLine(line),
    );
    insertIntoImdbTitlesTxn(imdbTitles);
    imdbTitles.forEach(({ id }) => imdbIds.add(id));

    const imdbTitleAliases = batch.map(([, line]) =>
      getImdbTitleAliasFromBasicsFileLine(line),
    );
    insertIntoImdbTitleAliasesTxn(imdbTitleAliases);
  },
  isMovieOrSeries,
  { batchSize: BATCH_SIZE },
);
await processFile(
  path.join(IMDB_DATA_DIR!, "title.akas.tsv"),
  async (batch: Batch) => {
    const imdbTitleAliases = batch.map(([, line]) =>
      getImdbTitleAliasFromAkasFileLine(line),
    );
    insertIntoImdbTitleAliasesTxn(imdbTitleAliases);
  },
  (line: string) => imdbIds.has(line.split("\t")[0]!),
  { batchSize: BATCH_SIZE },
);

// helpers

interface ImdbTitle {
  id: string;
  title: string;
  type: "movie" | "series";
  year: number | null;
}

interface ImdbTitleAlias {
  imdbId: string;
  titleAlias: string;
  region: string | null;
  language: string | null;
}

function prepareDb(db: TDatabase) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(
    `
        CREATE TABLE IF NOT EXISTS "imdbTitles" (
            "id" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "type" TEXT,
            "year" INTEGER,
            "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "meta" TEXT,
            PRIMARY KEY("id")
        )
    `,
  );

  db.exec(
    `
        CREATE TRIGGER IF NOT EXISTS update_imdbTitles_updatedAt
        AFTER UPDATE ON "imdbTitles"
        FOR EACH ROW
        BEGIN
        UPDATE "imdbTitles" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = OLD."id";
        END
    `,
  );

  db.exec(
    `
        CREATE TABLE IF NOT EXISTS "imdbTitleAliases" (
            "id" INTEGER NOT NULL,
            "imdbId" TEXT NOT NULL,
            "titleAlias" TEXT NOT NULL,
            "region" TEXT,
            "language" TEXT,
            "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "meta" TEXT,
            PRIMARY KEY("id"),
            FOREIGN KEY("imdbId") REFERENCES "imdbTitles"("id")
            CONSTRAINT uniqueImdbTitleAliases UNIQUE ("imdbId", "titleAlias", "region", "language")
        )
    `,
  );

  db.exec(
    `
        CREATE TRIGGER IF NOT EXISTS update_imdbTitleAliases_updatedAt
        AFTER UPDATE ON "imdbTitleAliases"
        FOR EACH ROW
        BEGIN
        UPDATE "imdbTitleAliases" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = OLD."id";
        END
    `,
  );
}

function getImdbTitleFromBasicsFileLine(line: string): ImdbTitle {
  const parts = line.split("\t");
  const type = ["movie", "tvMovie"].includes(parts[1]!) ? "movie" : "series";
  const year = parts[5] === "\\N" ? null : +parts[5]!;
  return {
    id: parts[0]!,
    title: parts[2]!,
    type,
    year,
  };
}

function getImdbTitleAliasFromBasicsFileLine(line: string): ImdbTitleAlias {
  const parts = line.split("\t");
  return {
    imdbId: parts[0]!,
    titleAlias: parts[3]!,
    region: "\\N",
    language: "\\N",
  };
}

function getImdbTitleAliasFromAkasFileLine(line: string): ImdbTitleAlias {
  const parts = line.split("\t");
  return {
    imdbId: parts[0]!,
    titleAlias: parts[2]!,
    region: parts[3]!,
    language: parts[4]!,
  };
}
