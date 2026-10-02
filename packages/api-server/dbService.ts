import Database, {
  type Database as TDatabase,
  type Transaction,
} from "better-sqlite3";
import { formatISO9075 } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import { type UserMessage, type Notification } from "siftcore";
import { pick, shallowEqual } from "siftutils";
import type {
  DbRecord,
  ProgramMatchRecord,
  RawProgramMatchRecord,
  UserMessageRecord,
  NotificationRecord,
  ProgramMatchQuery,
  RawProgramMatchQuery,
} from "./types.ts";

const env = pick(process.env, ["DB_PATH"], true);

const db: TDatabase = new Database(env.DB_PATH);
db.pragma("journal_mode = WAL");

export function transaction(fn: () => void): Transaction {
  return db.transaction(fn);
}

export function closeConnection() {
  db.close();
}

export function getProgramMatchRecord(
  idOrQuery: number | bigint | ProgramMatchQuery,
): ProgramMatchRecord | null {
  let rowId: number | bigint | undefined;

  if (typeof idOrQuery === "number" || typeof idOrQuery === "bigint") {
    rowId = idOrQuery as number | bigint;
  } else {
    const query: RawProgramMatchQuery = {
      ...pick(idOrQuery, ["title", "site"]),
      ...("type" in idOrQuery
        ? { type: idOrQuery.type === null ? "\\N" : idOrQuery.type }
        : {}),
      ...("year" in idOrQuery
        ? { year: idOrQuery.year === null ? 0 : idOrQuery.year }
        : {}),
    };
    rowId = db
      .prepare<RawProgramMatchQuery, { id: number | bigint }>(
        `SELECT id FROM titles WHERE title = $title AND site = $site
          ${"type" in query ? " AND type = $type " : ""}
          ${"year" in query ? " AND year = $year " : ""}`,
      )
      .get(query)?.id;
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
  data: Omit<ProgramMatchRecord, keyof DbRecord> & { meta?: string },
  onConflictClause = "",
) {
  if (Object.keys(data).length === 0)
    throw new Error("data arg cannot be empty object");

  const createData: Omit<RawProgramMatchRecord, keyof DbRecord> & {
    meta?: string;
  } = { ...data, type: data.type ?? "\\N", year: data.year ?? 0 };
  const entries = Object.entries(createData);

  const { changes, lastInsertRowid } = db
    .prepare(
      `INSERT INTO titles (${entries.map(([col]) => `"${col}"`).join(", ")})
      VALUES (${new Array(entries.length).fill("?").join(", ")})
      ${onConflictClause}`,
    )
    .run(...entries.map(([, val]) => val));

  return getProgramMatchRecord(
    changes === 1
      ? lastInsertRowid
      : pick(data, ["title", "type", "year", "site"]),
  )!;
}

export function updateProgramMatchRecord(
  rowId: number | bigint,
  data: Partial<
    Pick<ProgramMatchRecord, "status" | "imdbId" | "matchedBy" | "meta">
  >,
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

export function upsertProgramMatchRecord(
  data: Omit<ProgramMatchRecord, keyof DbRecord> & { meta?: string },
) {
  let row: ProgramMatchRecord | null = null;

  // TODO: use "INSERT ON CONFLICT DO UPDATE" here instead
  db.transaction(() => {
    row = createProgramMatchRecord(data, "ON CONFLICT DO NOTHING");
    const updateNeeded = !shallowEqual(data, pick(row, Object.keys(data)));
    if (updateNeeded) {
      row = updateProgramMatchRecord(
        row.id,
        pick(data, ["status", "imdbId", "matchedBy", "meta"]),
      );
    }
  })();

  return row!;
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
