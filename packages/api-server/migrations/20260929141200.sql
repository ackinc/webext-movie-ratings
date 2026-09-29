-- the migration 20260924000001.sql messed up the titles table
--   by dropping the primary key, column defaults, and triggers
--   (i.e. everything but the data)
-- this migration fixes that

CREATE TABLE "titles_new" (
  "id" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT '\\N',
  "year" INTEGER NOT NULL DEFAULT 0,
  "site" TEXT NOT NULL DEFAULT 'netflix',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "imdbId" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta" TEXT,
  PRIMARY KEY("id")
);

INSERT INTO titles_new SELECT * FROM titles WHERE id IS NOT NULL;

DROP TABLE titles;

ALTER TABLE titles_new RENAME TO titles;

CREATE TRIGGER update_titles_updatedAt
AFTER UPDATE ON "titles"
FOR EACH ROW
BEGIN
  UPDATE "titles" SET "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = OLD."id";
END;

CREATE UNIQUE INDEX idx_uniq_titles
ON titles(title, type, year, site);
