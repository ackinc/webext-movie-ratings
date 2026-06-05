import Database, { type Database as TDatabase } from "better-sqlite3";
import { type SiftApiProgramMatching, type UserMessage } from "sifttypes";
import { pick } from "siftutils";
import type { ProgramMatchRecord } from "./types.ts";

const env = pick(process.env, ["DB_PATH"], true);

const db: TDatabase = new Database(env.DB_PATH);
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

db.exec(`
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
`);

db.exec(`
  CREATE TRIGGER IF NOT EXISTS update_messages_updatedAt
  AFTER UPDATE ON "messages"
  FOR EACH ROW
  BEGIN
    UPDATE "messages" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = OLD."id";
  END
`);

export function closeConnection() {
  db.close();
}

export function getProgramMatchRecord(
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
  rowId: number | bigint,
  data: Partial<Pick<ProgramMatchRecord, "status" | "imdbId" | "meta">>,
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

export function getMessageById(id: number | bigint) {
  return db.prepare("SELECT * FROM messages WHERE id = ?").run(id);
}

export function createMessageRecord(userMessage: UserMessage) {
  const { email, category, message } = userMessage;
  const { lastInsertRowid } = db
    .prepare("INSERT INTO messages (email, category, message) VALUES (?, ?, ?)")
    .run(email ?? null, category, message);
  if (!lastInsertRowid) throw new Error(`Record creation failed`);
  return getMessageById(lastInsertRowid);
}
