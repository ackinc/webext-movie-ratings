import type {
  ProgramType,
  SiftApiProgramMatching,
  UserMessage,
  Notification,
  Sitename,
} from "siftcore";

export interface DbRecord {
  id: number;
  createdAt: string;
  updatedAt: string;
  meta: string | null;
}

// This is the data that goes into and comes out of the db
// We transform ProgramMatchRecords into RawProgramMatchRecords
//   before inserting into the db because of how UNIQUE constraints
//   are applied in SQL
// Grep NOTE_WHY_TITLES_TYPE_AND_YEAR_NOT_NULLABLE for details
export interface RawProgramMatchRecord extends DbRecord {
  title: string;
  type: ProgramType | "\\N";
  year: number | 0;
  site: Sitename;
  status: SiftApiProgramMatching.Status | "reportedIncorrect";
  imdbId: string | null;
  matchedBy: string | null;
}

export type RawProgramMatchQuery = Pick<
  RawProgramMatchRecord,
  "title" | "site"
> &
  Partial<Pick<RawProgramMatchRecord, "type" | "year">>;

// NOTE_PROGRAM_MATCH_RECORD_META_VALUE
// The value in `meta` column for a ProgramMatchRecord depends
//   on its `status`
// if status === 'matched', meta: {
//   bestMatch: IndexedImdbTitle
// }
// else if status === 'reportedIncorrect', meta: {
//   token: string,
//   suggestedMatches: IndexedImdbTitle[],
//   userSelectedMatch: IndexedImdbTitle
// }
// else (i.e. status === 'abandoned'), meta: null
export type ProgramMatchRecord = Omit<
  RawProgramMatchRecord,
  "type" | "year"
> & {
  type: ProgramType | null;
  year: number | null;
};

export type ProgramMatchQuery = Pick<ProgramMatchRecord, "title" | "site"> &
  Partial<Pick<ProgramMatchRecord, "type" | "year">>;

export interface UserMessageRecord
  extends DbRecord, Omit<UserMessage, "email"> {
  email: string | null;
}

export interface NotificationRecord extends DbRecord, Notification {}
