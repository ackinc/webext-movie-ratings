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
  type: ProgramType | null;
  year: number | null;
  source: string;
  status: MatchStatus;
  imdbId: string | null;
  createdAt: string;
  updatedAt: string;
}
