import type {
  ProgramType,
  SiftApiProgramMatching,
  UserMessage,
  Notification,
} from "siftcore";

export interface DbRecord {
  id: number;
  createdAt: string;
  updatedAt: string;
  meta: string | null;
}

export interface RawProgramMatchRecord extends DbRecord {
  title: string;
  type: ProgramType | "\\N";
  year: number | 0;
  status: SiftApiProgramMatching.Status | "pending";
  imdbId: string | null;
}

export type ProgramMatchRecord = Omit<
  RawProgramMatchRecord,
  "type" | "year"
> & {
  type: ProgramType | null;
  year: number | null;
};

export interface UserMessageRecord
  extends DbRecord, Omit<UserMessage, "email"> {
  email: string | null;
}

export interface NotificationRecord extends DbRecord, Notification {}
