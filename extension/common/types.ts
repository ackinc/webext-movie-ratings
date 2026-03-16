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
      // send from new content-scripts to old content-scripts to induce
      //   cleanup so the new content-script can take over the webpage
      type: MessageType.orphanCheck;
    }
  | {
      type: MessageType.cleanup;
    }
  | {
      type: MessageType.healthCheck;
    }
  | {
      type: MessageType.webpageRatingStats;
      data: {
        sessionStartTime: number;
        stats: WebpageStats;
        pageUrl: string;
        statsCollectionTime: number;
      };
    }
  | {
      // send from anywhere in the extension to the service-worker so the
      //   error can be logged in the telemetry store
      type: MessageType.error;
      data: {
        errorDetails: {
          name: string;
          message: string;
          stack: string;
        };
        context: ExtensionContext;
        pageUrl?: string;
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

// WARNING: if updating this type, don't forget to also update
//   ExtensionSettingsKeys in constants.ts!
export type ExtensionSettings = {
  errorReportingOptIn: boolean;
  programFiltersSettings: ProgramFilterSettings;
  popupSeenAtLeastOnce: boolean;
  outdatedSelectorDetectionEnabled: boolean;
  updatedDbVersion: number;
};

export type ExtensionContext =
  | "content-script"
  | "popup"
  | "service-worker"
  | "extension-page";
