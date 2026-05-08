import type { Database } from "better-sqlite3";
import { type SiftApiProgramMatching } from "sifttypes";
import type { ProgramMatchRecord } from "./types.ts";

export function getProgramMatchRecord(
  db: Database,
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
  db: Database,
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
  db: Database,
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
