import { Type } from "typebox";

export const programTypeSchema = Type.Enum(["movie", "series"]);

const siftApiProgramMatchStatus = Type.Enum([
  "pending",
  "matched",
  "abandoned",
]);
export const siftApiProgramMatchSchemas = {
  status: siftApiProgramMatchStatus,
  request: Type.Object({
    title: Type.String(),
    type: Type.Optional(programTypeSchema),
    year: Type.Optional(Type.Number()),
    pageUrl: Type.String(),
  }),
  response: Type.Object({
    status: siftApiProgramMatchStatus,
    imdbId: Type.Optional(Type.String()),
  }),
};
