import { MessageType, supportedSites } from "./constants";

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

export type SWMessageResponse<T> = { data: T } | { error: string };

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
      // Sent via window.postMessage from MAIN world content script to
      //   paired ISOLATED world content script in same tab
      type: MessageType.urlChange;
    }
  | {
      // Sent from popup to ISOLATED world content scripts in all relevant
      //   tabs
      type: MessageType.filterSettingsChange;
      data: ProgramFilterSettings;
    }
  | {
      // Sent from new ISO content-script to old ISO content-script
      //   just after extension update to induce cleanup of old ISO content
      //   script
      // Also sent from a running ISO content script to itself when it
      //   detects during normal operation that the runtime may have
      //   disappeared (for ex, because the user disabled/uninstalled
      //   the extension)
      // the data.source field is meant to disambiguate these 2 cases
      type: MessageType.orphanCheck;
      data: {
        trigger:
          | "new-content-script-injection"
          | "extension-runtime-disappeared";
      };
    }
  | {
      // Broadcast with window.postMessage from a newly-injected MAIN world
      //   content script (urlchange-dispatcher) to get outdated MAIN world
      //   content scripts to cleanup (if they exist)
      // Since the message will be received by both the outdated and
      //   the new MAIN world content scripts ("mwcs"), and we only want the
      //   outdated ones to cleanup, the new mwcs needs a way to know if it can
      //   ignore the message; the sourceId helps with this
      type: MessageType.outdatedUrlChangeDispatcherCleanup;
      data: { sourceId: number };
    }
  | {
      // Sent from popup to service-worker
      type: MessageType.sitesDisabled;
      data: { sites: Sitename[] };
    }
  | {
      // Sent from popup to service-worker
      type: MessageType.sitesEnabled;
      data: { sites: Sitename[] };
    }
  | {
      // Sent from service-worker to ISOLATED world content-script
      // Re-broadcast (via window.postMessage) by the ISO content-script
      //   so the MAIN world content script also gets the message
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

export type ExtensionSettings = {
  errorReportingOptIn: boolean;
  programFiltersSettings: ProgramFilterSettings;
  popupSeenAtLeastOnce: boolean;
  outdatedSelectorDetectionEnabled: boolean;
  updatedDbVersion: number;
  onboardingStatus:
    | "started"
    | "askedUserForPermissions"
    | "displayedPermissionStatus"
    | "pitchedErrorReporting"
    | "finished";
};

export type ExtensionContext =
  | "content-script"
  | "popup"
  | "service-worker"
  | "extension-page";

export type Sitename = keyof typeof supportedSites;
export type PermString =
  (typeof supportedSites)[Sitename]["permStrings"][number];
