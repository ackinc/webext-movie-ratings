import { useEffect, useState } from "preact/hooks";
import "./SitePermsControlForm.css";

const supportedSites = [
  "amazonprimevideo",
  "appletv",
  "crunchyroll",
  "hotstar",
  "netflix",
  "sonyliv",
  "youtubemovies",
] as const;
type Sitename = (typeof supportedSites)[number];
type IsEnabled = boolean;

export default function SitePermsControlForm() {
  const [sitePerms, setSitePerms] = useState(
    supportedSites.reduce(
      (acc, site) => Object.assign(acc, { [site]: false }),
      {} as Record<Sitename, IsEnabled>,
    ),
  );

  // TODO: load persisted settings
  useEffect(() => {}, []);

  return (
    <form className="site-control-form">
      <h4>What OTT sites should Sift run on?</h4>

      {supportedSites.map((site) => {
        return (
          <div key={site} className="form-control">
            <input
              type="checkbox"
              id={`sitePermFor_${site}`}
              name={`sitePermFor_${site}`}
              checked={sitePerms[site]}
              onChange={() => toggleSitePerms(site)}
            />
            <label for={`sitePermFor_${site}`}>{site}</label>
          </div>
        );
      })}
    </form>
  );

  async function toggleSitePerms(siteName: Sitename) {
    const isEnabled = sitePerms[siteName];

    if (isEnabled) {
      // TODO: make service worker remove content script from open tabs
      // TODO: remove optional perms for this site
    } else {
      // TODO: ask for permission
      // TODO: if not granted, return early
      // TODO: if granted, inject content script into open tabs
    }

    setSitePerms({ ...sitePerms, [siteName]: !isEnabled });
  }
}
