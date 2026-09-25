import Database, { type Database as TDatabase } from "better-sqlite3";
import { formatISO9075 } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import {
  type SiftApiProgramMatching,
  type UserMessage,
  type Notification,
} from "sifttypes";
import { pick } from "siftutils";
import type {
  DbRecord,
  ProgramMatchRecord,
  RawProgramMatchRecord,
  UserMessageRecord,
  NotificationRecord,
} from "./types.ts";

const env = pick(process.env, ["DB_PATH"], true);

const db: TDatabase = new Database(env.DB_PATH);
db.pragma("journal_mode = WAL");

export function closeConnection() {
  db.close();
}

export function getProgramMatchRecord(
  idOrProgram:
    | number
    | bigint
    | Pick<SiftApiProgramMatching.Request, "title" | "type" | "year">,
): ProgramMatchRecord | null {
  let rowId: number | bigint | undefined;

  if (typeof idOrProgram === "number" || typeof idOrProgram === "bigint") {
    rowId = idOrProgram as number | bigint;
  } else {
    rowId = db
      .prepare<
        Pick<SiftApiProgramMatching.Request, "title" | "type" | "year">,
        { id: number | bigint }
      >(
        `SELECT id FROM titles WHERE title = $title
          ${"type" in idOrProgram ? " AND type = $type " : ""}
          ${"year" in idOrProgram ? " AND year = $year " : ""}`,
      )
      .get(idOrProgram)?.id;
  }

  if (rowId === undefined) return null;

  const row = getRecordById<RawProgramMatchRecord>(rowId, "titles");
  return {
    ...row,
    type: row.type === "\\N" ? null : row.type,
    year: row.year === 0 ? null : row.year,
  };
}

export function createProgramMatchRecord(
  data: Pick<SiftApiProgramMatching.Request, "title" | "type" | "year"> & {
    meta?: string;
  },
  onConflictClause = "",
) {
  const entries = Object.entries(data);
  if (entries.length === 0) throw new Error("data arg cannot be empty object");
  const { changes, lastInsertRowid } = db
    .prepare(
      `INSERT INTO titles (${entries.map(([col]) => `"${col}"`).join(", ")})
      VALUES (${new Array(entries.length).fill("?").join(", ")})
      ${onConflictClause}`,
    )
    .run(...entries.map(([, val]) => val));

  return getProgramMatchRecord(
    changes === 1 ? lastInsertRowid : pick(data, ["title", "type", "year"]),
  )!;
}

export function updateProgramMatchRecord(
  rowId: number | bigint,
  data: Partial<Pick<ProgramMatchRecord, "status" | "imdbId" | "meta">>,
) {
  const entries = Object.entries(data);
  if (entries.length > 0) {
    db.prepare(
      `UPDATE titles SET ${entries.map(([col]) => `${col} = ?`).join(", ")}
        WHERE id = ?`,
    ).run(...entries.map(([, val]) => val), rowId);
  }
  return getRecordById<ProgramMatchRecord>(rowId, "titles");
}

export function createMessageRecord(userMessage: UserMessage) {
  const { email, category, message } = userMessage;
  const { lastInsertRowid } = db
    .prepare("INSERT INTO messages (email, category, message) VALUES (?, ?, ?)")
    .run(email ?? null, category, message);
  if (!lastInsertRowid) throw new Error(`Record creation failed`);
  return getRecordById<UserMessageRecord>(lastInsertRowid, "messages");
}

export function createNotification(
  notification: Notification,
): NotificationRecord {
  const { notificationId, targetPage, content, timestamp } = notification;
  const { lastInsertRowid } = db
    .prepare(
      "INSERT INTO notifications (notificationId, targetPage, content, createdAt) VALUES (?, ?, ?, ?)",
    )
    .run(
      notificationId,
      targetPage,
      content,
      formatISO9075(timestamp ? new UTCDate(timestamp) : new UTCDate()),
    );
  if (!lastInsertRowid) throw new Error(`Record creation failed`);
  return getRecordById<NotificationRecord>(lastInsertRowid, "notifications");
}

export function getNotificationsSince(fromMs: number): NotificationRecord[] {
  const fromTimestamp = formatISO9075(new UTCDate(fromMs));
  const rows = db
    .prepare<
      [string],
      NotificationRecord
    >("SELECT * FROM notifications WHERE createdAt >= ? ORDER BY createdAt DESC")
    .all(fromTimestamp);

  for (const row of rows) {
    // makes future parseISO calls treat the string as representing
    //   a UTC date, instead of a date in the current system timezone
    row.createdAt = row.createdAt.replace(" ", "T") + "Z";
    row.updatedAt = row.updatedAt.replace(" ", "T") + "Z";
  }

  return rows;
}

function getRecordById<T extends DbRecord>(
  id: number | bigint,
  table: string,
): T {
  const row = db
    .prepare<[number | bigint], T>(`SELECT * FROM ${table} WHERE id = ?`)
    .get(id);

  if (!row) throw new Error(`No row with id ${id} in '${table}'`);

  // makes future parseISO calls treat the string as representing
  //   a UTC date, instead of a date in the current system timezone
  row.createdAt = row.createdAt.replace(" ", "T") + "Z";
  row.updatedAt = row.updatedAt.replace(" ", "T") + "Z";

  return row;
}
