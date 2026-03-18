import { useEffect, useRef, useState } from "preact/hooks";
import { browser, ensureError, ErrorMessage, MessageType } from "../common";
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

const msDelayBeforeRequestingPerms = 2000;

export default function SitePermsControlForm() {
  const [sitePerms, setSitePerms] = useState(
    Object.keys(supportedSites).reduce(
      (acc, site) => Object.assign(acc, { [site]: false }),
      {} as Record<Sitename, IsEnabled>,
    ),
  );

  // When a user enables Sift on a particular site, we want to queue
  //   the relevant optional host permissions to be requested after
  //   a short timeout
  // We do this instead of requesting the perm immediately because
  //   when a host perm is requested, it triggers the browser's
  //   "additional permission" warning which force-closes the extension
  //   popup
  // So the UX for a user that wants to enable multiple sites
  //   in quick succession would be absolute horrible
  const [pendingPerms, setPendingPerms] = useState<PermString[]>([]);
  const timeoutRef = useRef<number | null>(null);

  // load persisted perms
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

  // request perms for just-enabled sites after a delay to ensure the user
  //   has stopped interacting with the form
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (pendingPerms.length === 0) return;
    timeoutRef.current = setTimeout(
      requestPendingPerms,
      msDelayBeforeRequestingPerms,
    );

    async function requestPendingPerms() {
      try {
        const granted = await browser.permissions.request({
          origins: pendingPerms,
        });
        if (!granted) throw new Error(ErrorMessage.hostPermissionNotGranted);
      } catch (e) {
        ensureError(e);

        // reverse optimistic update to sitePerms
        setSitePerms((sp) => ({
          ...sp,
          ...pendingPerms
            .map((ps) => permStringToSitename[ps])
            .reduce((acc, s) => Object.assign(acc, { [s]: false }), {}),
        }));

        if (e.message !== ErrorMessage.hostPermissionNotGranted) {
          handlePermissionError(e);
        }
      } finally {
        setPendingPerms([]);
      }
    }
  }, [pendingPerms]);

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

    // being careful not to mutate the supportedSites obj
    let permStrings = supportedSites[site].permStrings.concat() as PermString[];

    try {
      if (isEnabled) {
        // Due to optimistic update when granting perms (see a little
        //   further down this function body), we may be in a situation
        //   where the user is trying to revoke a perm that has not yet
        //   actually been granted
        // If we detect that we're in this edge-timeline, all we should
        //   do is remove the perm from pendingPerms
        if (permStrings.some((ps) => pendingPerms.includes(ps))) {
          setPendingPerms((pps) =>
            pps.filter((pp) => !permStrings.includes(pp)),
          );
          permStrings = permStrings.filter((ps) => !pendingPerms.includes(ps));
        }

        // remove sift from any already-open webpages associated with the
        //   perms we're about to remove
        await browser.runtime.sendMessage({
          type: MessageType.cleanup,
          data: { origins: permStrings },
        });

        // disable the permission
        await browser.permissions.remove({ origins: permStrings });
      } else {
        setPendingPerms((pps) => pps.concat(permStrings));
      }

      // optimistic update
      setSitePerms({ ...sitePerms, [site]: !isEnabled });
    } catch (e) {
      handlePermissionError(e as Error);
    }
  }

  function handlePermissionError(e: Error) {
    captureException(e);

    // TODO: can we do better?
    alert("There was an error toggling the permission.");
  }
}
