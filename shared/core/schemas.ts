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
  incorrectMatchReportRequest: Type.Object({
    title: Type.String(),
    type: Type.Optional(programTypeSchema),
    year: Type.Optional(Type.Number()),
    pageUrl: Type.String(),
    imdbId: Type.String(),
  }),
  addSuggestionToIncorrectMatchReportRequest: Type.Script(`{
    id: number;
    token?: string;
    suggestionId: string;
    authToken?: string;
  }`),
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

export const indexedImdbTitleSchema = Type.Object({
  id: Type.String(),
  imdbId: Type.String(),
  title: Type.String(),
  type: programTypeSchema,
  year: Type.Union([Type.Number(), Type.Null()]),
});
