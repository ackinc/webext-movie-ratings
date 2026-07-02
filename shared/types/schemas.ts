import { Type } from "typebox";

export const programTypeSchema = Type.Enum(["movie", "series"]);

const siftApiProgramMatchStatus = Type.Enum(["matched", "abandoned"]);
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

const userMessageCategory = Type.Enum([
  "feedback",
  "incorrect-rating-report",
  "uninstall-reason",
  "other",
]);
export const userMessageSchema = Type.Object({
  email: Type.Optional(Type.String()),
  category: userMessageCategory,
  message: Type.String(),
});

export const notificationSchema = Type.Object({
  notificationId: Type.String(),
  targetPage: Type.String(),
  content: Type.String(),
  timestamp: Type.Optional(Type.Number()),
});
