import { browser, MessageType } from "./constants";
import * as storage from "./storage";
import type {
  Message,
  OnboardingStatus,
  ProgramFilterSettings,
  SWMessageResponse,
} from "./types";
import { SWError } from "./customErrors";

export const boolSettings = {
  errorReportingOptIn: {
    for: "user",
    default: false,
    label: "Opt-in to error reporting?",
  },

  outdatedSelectorDetectionEnabled: {
    for: "dev",
    default: false,
    label: "Enable outdated-selector-detection?",
  },
  mediaRequestBlockingEnabled: {
    for: "dev",
    default: false,
    label: "Block media requests?",
    onChange: async (value: boolean) => {
      const response = await browser.runtime.sendMessage<
        Message,
        SWMessageResponse<{ enabled: boolean }>
      >({
        type: MessageType.setMediaRequestBlockingState,
        data: { value },
      });
      if ("error" in response) throw new SWError(response.error);
    },
  },
  throwDataExtractionErrors: {
    for: "dev",
    default: false,
    label: "Halt extension on first data-extraction error?",
  },
} as const;

export type BoolSettingName = keyof typeof boolSettings;
export type BoolSettingConf = (typeof boolSettings)[BoolSettingName];
export type BoolExtensionSettings = Record<BoolSettingName, boolean>;
export type ExtensionSettings = BoolExtensionSettings & {
  // "breadcrumbs" automatically dropped by the extension
  extensionInstallTime: number;
  extensionLastUpdateTime: number;
  updatedDbVersion: number;
  onboardingStatus: OnboardingStatus;

  // explicit choices
  programFiltersSettings: ProgramFilterSettings;
};

export async function getSetting<K extends keyof ExtensionSettings>(
  key: K,
): Promise<ExtensionSettings[K] | undefined> {
  return await storage.get(key);
}

export async function setSetting<K extends keyof ExtensionSettings>(
  key: K,
  value: ExtensionSettings[K],
): Promise<void> {
  await storage.set(key, value);
}
