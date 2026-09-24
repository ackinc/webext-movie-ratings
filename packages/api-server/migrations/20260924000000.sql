-- create the basic tables, constraints and triggers

-- can't allow type and year be NULLABLE because the UNIQUE
--   constraint won't work as one would expect
-- see https://sqlite.org/faq.html#q26
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
);

CREATE TRIGGER IF NOT EXISTS update_titles_updatedAt
AFTER UPDATE ON "titles"
FOR EACH ROW
BEGIN
  UPDATE "titles" SET "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = OLD."id";
END;

CREATE TABLE IF NOT EXISTS "messages" (
  "id"	INTEGER NOT NULL,
  "email"	TEXT,
  "category"	TEXT NOT NULL,
  "message"	TEXT NOT NULL,
  "createdAt"	TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"	TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta"	TEXT,
  PRIMARY KEY("id")
);

CREATE TRIGGER IF NOT EXISTS update_messages_updatedAt
AFTER UPDATE ON "messages"
FOR EACH ROW
BEGIN
  UPDATE "messages" SET "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = OLD."id";
END;

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" INTEGER NOT NULL,
  "notificationId" TEXT NOT NULL,
  "targetPage" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta" TEXT,
  PRIMARY KEY("id"),
  UNIQUE("notificationId")
);

CREATE TRIGGER IF NOT EXISTS update_notifications_updatedAt
AFTER UPDATE ON "notifications"
FOR EACH ROW
BEGIN
  UPDATE "notifications" SET "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = OLD."id";
END;

CREATE TABLE IF NOT EXISTS "migrations" (
  "id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'success',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY("id")
);

CREATE TRIGGER IF NOT EXISTS update_migrations_updatedAt
AFTER UPDATE ON "migrations"
FOR EACH ROW
BEGIN
  UPDATE "migrations" SET "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = OLD."id";
END;