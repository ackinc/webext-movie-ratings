import { type Static } from "typebox";
import {
  programTypeSchema,
  siftApiProgramMatchSchemas,
  userMessageSchema,
  notificationSchema,
  indexedImdbTitleSchema,
} from "./schemas.ts";

export type ProgramType = Static<typeof programTypeSchema>;

export namespace SiftApiProgramMatching {
  export type Status = Static<typeof siftApiProgramMatchSchemas.status>;
  export type Request = Static<typeof siftApiProgramMatchSchemas.request>;
  export type Response = Static<typeof siftApiProgramMatchSchemas.response>;
}

export type UserMessage = Static<typeof userMessageSchema>;

export type Notification = Static<typeof notificationSchema>;

// represents the data we put into our search engine
export type IndexedImdbTitle = Static<typeof indexedImdbTitleSchema>;
