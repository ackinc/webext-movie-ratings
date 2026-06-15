import { type Static } from "typebox";
import {
  programTypeSchema,
  siftApiProgramMatchSchemas,
  userMessageSchema,
} from "./schemas.ts";

export type ProgramType = Static<typeof programTypeSchema>;

export namespace SiftApiProgramMatching {
  export type Status = Static<typeof siftApiProgramMatchSchemas.status>;
  export type Request = Static<typeof siftApiProgramMatchSchemas.request>;
  export type Response = Static<typeof siftApiProgramMatchSchemas.response>;
}

export type UserMessage = Static<typeof userMessageSchema>;
