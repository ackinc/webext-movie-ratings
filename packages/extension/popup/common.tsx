export {
  permStringToSitename,
  supportedSites,
  type PermString,
  type PopupPage,
  type Sitename,
} from "@common";

export type SiteStatus = "enabled" | "toEnable" | "disabled" | "toDisable";
export function getSiteStatusOnUserToggle(curStatus: SiteStatus): SiteStatus {
  switch (curStatus) {
    case "enabled":
      return "toDisable";
    case "toEnable":
      return "disabled";
    case "disabled":
      return TARGET_BROWSER === "firefox" ? "enabled" : "toEnable";
    case "toDisable":
      return "enabled";
    default:
      throw new Error(`Unexpected site status: ${curStatus}`);
  }
}
