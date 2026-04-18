import { Type } from "typebox";

export const programTypeSchema = Type.Enum(["movie", "series"]);
export const programSchema = Type.Object({
  title: Type.String(),
  type: Type.Optional(programTypeSchema),
  year: Type.Optional(Type.Number()),
  website: Type.String(),
});

export const matchStatusSchema = Type.Enum(["pending", "matched", "abandoned"]);
export const programMatchResponseSchema = Type.Object({
  status: matchStatusSchema,
  imdbId: Type.Optional(Type.String()),
});
