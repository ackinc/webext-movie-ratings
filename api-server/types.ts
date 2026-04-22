import { type Static } from "typebox";
import {
  programSchema,
  programTypeSchema,
  programMatchResponseSchema,
  matchStatusSchema,
} from "./schemas.ts";

export type ProgramType = Static<typeof programTypeSchema>;
export type Program = Static<typeof programSchema>;

export type MatchStatus = Static<typeof matchStatusSchema>;
export type ProgramMatchResponse = Static<typeof programMatchResponseSchema>;

export interface ProgramMatchRecord {
  id: number;
  title: string;
  type: ProgramType | "\\N";
  year: number;
  status: MatchStatus;
  imdbId: string | null;
  createdAt: string;
  updatedAt: string;
  meta: string | null;
}

export interface IndexedImdbTitle {
  id: string;
  imdbId: string;
  title: string;
  type: "movie" | "series";
  year: number | null;
}
