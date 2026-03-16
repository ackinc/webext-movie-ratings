import { useEffect, useState } from "preact/hooks";
import { browser, MessageType } from "../common";
import { captureException } from "../common/errorReporter";
import "./SitePermsControlForm.css";

const supportedSites = {
  amazonprimevideo: {
    displayName: "Amazon Prime Video",
    permStrings: ["https://www.primevideo.com/*", "https://www.amazon.com/*"],
  },
  appletv: {
    displayName: "AppleTV",
    permStrings: ["https://tv.apple.com/*"],
  },
  crunchyroll: {
    displayName: "Crunchyroll",
    permStrings: ["https://www.crunchyroll.com/*"],
  },
  hotstar: {
    displayName: "Hotstar",
    permStrings: ["https://www.hotstar.com/*"],
  },
  netflix: {
    displayName: "Netflix",
    permStrings: ["https://www.netflix.com/*"],
  },
  sonyliv: {
    displayName: "SonyLIV",
    permStrings: ["https://www.sonyliv.com/*"],
  },
  youtubemovies: {
    displayName: "Youtube Movies",
    permStrings: ["https://www.youtube.com/*"],
  },
} as const;
type Sitename = keyof typeof supportedSites;
type PermString = (typeof supportedSites)[Sitename]["permStrings"][number];
type IsEnabled = boolean;

const permStringToSitename = Object.entries(supportedSites).reduce(
  (acc, [sitename, { permStrings }]) =>
    Object.assign(
      acc,
      permStrings.reduce(
        (acc2, ps) => Object.assign(acc2, { [ps]: sitename }),
        {},
      ),
    ),
  {},
) as Record<PermString, Sitename>;

export default function SitePermsControlForm() {
  const [sitePerms, setSitePerms] = useState(
    Object.keys(supportedSites).reduce(
      (acc, site) => Object.assign(acc, { [site]: false }),
      {} as Record<Sitename, IsEnabled>,
    ),
  );

  useEffect(() => {
    (async () => {
      const allOrigins = (await browser.permissions.getAll()).origins ?? [];
      const persistedPerms = allOrigins.reduce(
        (acc, o) =>
          Object.assign(acc, { [permStringToSitename[o as PermString]]: true }),
        {},
      );
      setSitePerms((old) => ({ ...old, ...persistedPerms }));
    })();
  }, []);

  return (
    <form className="site-control-form">
      <h4>What sites should Sift run on?</h4>

      {(Object.keys(supportedSites) as Sitename[]).map((site) => {
        const label = `sitePermFor${supportedSites[site].displayName.replace(/\s/g, "")}`;
        return (
          <div key={site} className="form-control">
            <input
              type="checkbox"
              id={label}
              name={label}
              checked={sitePerms[site]}
              onChange={() => toggleSitePerms(site)}
            />
            <label for={label}>{supportedSites[site].displayName}</label>
          </div>
        );
      })}
    </form>
  );

  async function toggleSitePerms(site: Sitename) {
    const isEnabled = sitePerms[site];
    const permStrings = supportedSites[site].permStrings as unknown as string[];

    try {
      if (isEnabled) {
        // disable the permission
        await browser.runtime.sendMessage({
          type: MessageType.cleanup,
          data: { origins: permStrings },
        });

        await browser.permissions.remove({ origins: permStrings });
      } else {
        const granted = await browser.permissions.request({
          origins: permStrings,
        });
        if (!granted) return;

        // nothing else to do here; the permissions.onAdded listener in the
        //   service worker will take care of injecting the content script
        //   into the appropriate already-open tabs
      }

      setSitePerms({ ...sitePerms, [site]: !isEnabled });
    } catch (e) {
      captureException(e);

      // TODO: can we do better?
      alert("There was an error toggling the permission.");
    }
  }
}
