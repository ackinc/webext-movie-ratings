import { Type } from "typebox";
import { MatchStatus, ProgramType } from "./constants.ts";

export const programSchema = Type.Object({
  title: Type.String(),
  type: Type.Optional(Type.Enum(Object.values(ProgramType))),
  year: Type.Optional(Type.Number()),
  website: Type.String(),
});

export const programMatchResponseSchema = Type.Object({
  status: Type.Enum(Object.values(MatchStatus)),
  imdbId: Type.Optional(Type.String()),
});
