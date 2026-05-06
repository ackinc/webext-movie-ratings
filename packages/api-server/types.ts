import type { ProgramType, SiftApiProgramMatching } from "sifttypes";

export interface ProgramMatchRecord {
  id: number;
  title: string;
  type: ProgramType | "\\N";
  year: number;
  status: SiftApiProgramMatching.Status;
  imdbId: string | null;
  createdAt: string;
  updatedAt: string;
  meta: string | null;
}

export interface IndexedImdbTitle {
  id: string;
  imdbId: string;
  title: string;
  type: ProgramType;
  year: number | null;
}
