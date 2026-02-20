import { MessageType } from "./constants";

export type ProgramContainer = {
  selector: Selector;
  node: HTMLElement;
  title: string;
};

export type Program = {
  node: HTMLElement;
  title: string;
  type?: "movie" | "series";
  year?: string;
};

export type IMDBData = {
  imdbID: string;
  imdbRating: string;
};

export type CachedIMDBData = IMDBData & {
  key: string;
  expiry: number;
};

export type SWErrorResponse = {
  error: string;
};

export type OmdbApiResponse =
  | {
      Error: string;
    }
  | {
      imdbID: string;
      imdbRating: string;
    };

export type ProgramFilterSettings = {
  minRating: number;
  maxRating: number;
  excludeUnratedPrograms: boolean;
  transparency: number;
};

export type NumberRange = {
  min: number;
  max: number;
};

export type Message = {
  messageType: MessageType;
  data?: unknown;
};

export type IsOptional = boolean;

export type UrlPath = string;
export type Selector = string;
export type FailureCount = number;
export type SelectorStatus = "active" | FailureCount | "probablyOutOfDate";
export type SelectorStatusForPathname = Record<Selector, SelectorStatus>;
export type SelectorStatusForSite = Record<UrlPath, SelectorStatusForPathname>;
