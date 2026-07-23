import type { Notification as SiftNotification } from "sifttypes";
import { MessageType, supportedSites } from "./constants";

export type ProgramContainerData = {
  title: string;
};
// represents a list or grid of movies/shows on a webpage
export type ProgramContainer = {
  selector: Selector;
  node: HTMLElement;
} & ProgramContainerData;

export type ProgramData = {
  title: string;
  type?: "movie" | "series";
  year?: number;
};
// represents a movie/show identified on a webpage
export type Program = {
  container: ProgramContainer;
  selector: Selector;
  node: HTMLElement;
} & ProgramData;

// associated with a particular Program
export type IMDBData = {
  imdbId: string;
  imdbRating:
    | number
    | "N/A" /* matched program to an imdb id, but rating not available */
    | "N/F" /* could not matched program to an imdb id */
    | "N/M" /* (temporary) error when matching program to an imdb id */;
  expiry?: number;
  wasReportedIncorrect?: boolean;
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
      type: MessageType.fetchCachedIMDBRating;
      data: {
        program: Omit<Program, "node" | "container">;
        pageUrl: string;
      };
    }
  | {
      type: MessageType.fetchIMDBRating;
      data: {
        program: Omit<Program, "node" | "container">;
        pageUrl: string;
      };
    }
  | {
      type: MessageType.reportIncorrectProgramMatch;
      data: {
        program: Omit<Program, "node" | "container">;
        imdbData: IMDBData;
        pageUrl: string;
      };
    }
  | {
      type: MessageType.undoReportIncorrectProgramMatch;
      data: {
        program: Omit<Program, "node" | "container">;
        imdbData: IMDBData;
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
      // sent from popup's dev control panel to active tab's ISO content-script
      type:
        | MessageType.getSelectProgramModeState
        | MessageType.toggleSelectProgramMode;
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
      type: MessageType.setMediaRequestBlockingState;
      data: { value: boolean };
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
  nProgramsRatedNM: number;
};

export type ExtensionSettings = {
  extensionInstallTime: number;
  extensionLastUpdateTime: number;
  errorReportingOptIn: boolean;
  programFiltersSettings: ProgramFilterSettings;
  updatedDbVersion: number;
  onboardingStatus:
    | "started"
    | "askedUserForPermissions"
    | "displayedPermissionStatus"
    | "pitchedErrorReporting"
    | "finished";
  pitchMissingRatingReportingPageSeen: boolean;
} & ExtensionDeveloperSettings;

type ExtensionDeveloperSettings = {
  outdatedSelectorDetectionEnabled: boolean;
  mediaRequestBlockingEnabled: boolean;
  throwDataExtractionErrors: boolean;
};

export type ExtensionContext =
  | "content-script"
  | "popup"
  | "service-worker"
  | "extension-page";

export type Sitename = keyof typeof supportedSites;
export type PermString =
  (typeof supportedSites)[Sitename]["permStrings"][number];

export type PopupPage =
  | "onboarding"
  | "filters"
  | "settings"
  | "pitchErrorReporting"
  | "pitchMissingRatingReporting"
  | "feedbackForm";

export type InAppNotificationStatus = "unseen" | "seen" | "dismissed";
export interface InAppNotification extends SiftNotification {
  status: InAppNotificationStatus;
  timestamp: number;
}
