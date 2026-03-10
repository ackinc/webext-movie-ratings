import { MessageType } from "./constants";

export type ProgramContainerData = {
  title: string;
};
export type ProgramContainer = {
  selector: Selector;
  node: HTMLElement;
} & ProgramContainerData;

export type ProgramData = {
  title: string;
  type?: "movie" | "series";
  year?: string;
};
export type Program = {
  selector: Selector;
  node: HTMLElement;
} & ProgramData;

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

export type Message =
  | {
      type: MessageType.fetchIMDBRating;
      data: {
        program: Omit<Program, "node">;
        pageUrl: string;
      };
    }
  | {
      type: MessageType.urlChange;
    }
  | {
      type: MessageType.filterSettingsChange;
      data: ProgramFilterSettings;
    }
  | {
      type: MessageType.orphanCheck;
    }
  | {
      type: MessageType.healthCheck;
    }
  | {
      type: MessageType.webpageRatingStats;
      data: {
        id: string;
        stats: WebpageStats;
        pageUrl: string;
        timestamp: number;
      };
    }
  | {
      type: MessageType.placeholder;
      data?: unknown;
    };

export type IsOptional = boolean;

export type UrlPath = string;
export type Selector = string;
export type SelectorStatus = "active" | "probablyOutOfDate";
export type SelectorStatusForPathname = Record<Selector, SelectorStatus>;
export type SelectorStatusForSite = Record<UrlPath, SelectorStatusForPathname>;

export type WebpageStats = {
  nPrograms: number;
  nProgramsWithNoRatingNode: number;
  nProgramsRatedNA: number;
  nProgramsRatedNF: number;
};
