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

export interface ErrorDetails {
  name: string;
  message: string;
  stack: string | undefined;
}

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
      // sent from new content-scripts to old content-scripts just after
      //   extension update to induce cleanup of old content script
      // also sent from a running content script to itself when it is
      //   detecting during normal operation that the runtime may have
      //   disappeared (for ex, because the user disabled/uninstalled
      //   the extension)
      // the data.source field is meant to disambiguate these 2 cases
      type: MessageType.orphanCheck;
      data: {
        trigger:
          | "new-content-script-injection"
          | "content-script-runtime-disappeared";
      };
    }
  | {
      // sent from popup to service-worker when user revokes a
      //   previously-granted optional host permission
      // sent again, with data-arg stripped, from service-worker
      //   to content-script to induce cleanup in tabs where
      //   we no longer have the user's permission
      type: MessageType.cleanup;
      data?: { origins: string[] };
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
        errorDetails: ErrorDetails;
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
