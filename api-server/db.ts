import Database, { type Database as TDatabase } from "better-sqlite3";

export function initDb(dbPath: string): TDatabase {
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");

  // can't allow type and year be NULLABLE because the UNIQUE
  //   constraint won't work as one would expect
  // see https://sqlite.org/faq.html#q26
  db.exec(`
    CREATE TABLE IF NOT EXISTS "titles" (
      "id" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT '\\N',
      "year" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "imdbId" TEXT,
      "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "meta" TEXT,
      PRIMARY KEY("id"),
      UNIQUE("title", "type", "year")
    )
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_titles_updatedAt
    AFTER UPDATE ON "titles"
    FOR EACH ROW
    BEGIN
      UPDATE "titles" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = OLD."id";
    END
  `);

  return db;
}
