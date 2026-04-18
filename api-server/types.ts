import { type Static } from "typebox";
import { MatchStatus } from "./constants.ts";
import { programSchema, programMatchResponseSchema } from "./schemas.ts";

export type Program = Static<typeof programSchema>;
export type ProgramMatchResponse = Static<typeof programMatchResponseSchema>;

export interface ProgramMatchRecord {
  id: number;
  title: string;
  type: MatchStatus | null;
  year: number | null;
  source: string;
  status: MatchStatus;
  imdbId: string | null;
  createdAt: string;
  updatedAt: string;
}
