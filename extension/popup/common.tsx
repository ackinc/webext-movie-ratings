export type CurPage = "onboarding" | "filters" | "settings";

export type { PermString, Sitename } from "../common/types";
export { supportedSites, permStringToSitename } from "../common/constants";

export type SiteStatus = "enabled" | "toEnable" | "disabled" | "toDisable";
export function getSiteStatusOnUserToggle(curStatus: SiteStatus): SiteStatus {
  switch (curStatus) {
    case "enabled":
      return "toDisable";
    case "toEnable":
      return "disabled";
    case "disabled":
      return "toEnable";
    case "toDisable":
      return "enabled";
    default:
      throw new Error(`Unexpected site status: ${curStatus}`);
  }
}
