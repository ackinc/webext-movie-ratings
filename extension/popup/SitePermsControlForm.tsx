import { useEffect, useRef, useState } from "preact/hooks";
import {
  browser,
  ensureError,
  ErrorMessage,
  MessageType,
  type Message,
} from "../common";
import { captureException } from "../common/errorReporter";
import loadingIndicator from "../../images/loading.svg";
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

const msDelayBeforeRequestingOrRenouncingPerms = 2000;

export default function SitePermsControlForm() {
  const [error, setError] = useState<Error | null>(null);

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
      msDelayBeforeRequestingOrRenouncingPerms,
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
      {error ? <p className="error">Sorry, something went wrong ...</p> : null}

      {(Object.keys(supportedSites) as Sitename[]).map((site) => {
        const label = `sitePermFor${supportedSites[site].displayName.replace(/\s/g, "")}`;
        const isPending = supportedSites[site].permStrings.some((ps) =>
          pendingPerms.includes(ps),
        );
        return (
          <div
            key={site}
            className={`form-control ${isPending ? "pending" : ""}`}
          >
            <input
              type="checkbox"
              id={label}
              name={label}
              checked={sitePerms[site]}
              onChange={() => toggleSitePerms(site)}
            />
            <label for={label}>
              {supportedSites[site].displayName}
              {isPending ? <img src={loadingIndicator} /> : null}
            </label>
          </div>
        );
      })}
    </form>
  );

  async function toggleSitePerms(site: Sitename) {
    const isEnabled = sitePerms[site];

    // optimistic update
    setSitePerms({ ...sitePerms, [site]: !isEnabled });

    // being careful not to mutate the supportedSites obj
    let permStrings = supportedSites[site].permStrings.concat() as PermString[];

    try {
      if (isEnabled) {
        // Due to optimistic update (see above) when granting perms, we
        //   may be in a situation where the user is trying to revoke a
        //   perm that has not yet actually been granted
        // If we detect that we're in this edge-timeline, all we should
        //   do is remove the perm from pendingPerms
        if (permStrings.some((ps) => pendingPerms.includes(ps))) {
          setPendingPerms((pps) =>
            pps.filter((pp) => !permStrings.includes(pp)),
          );
          permStrings = permStrings.filter((ps) => !pendingPerms.includes(ps));
        }

        if (permStrings.length > 0) {
          // The service worker will take care of removing sift from any
          //   already-open webpages associated with the perms we're about
          //   to remove
          // The code to revoke the permission could have been called from
          //   here as well, but since we want a bit of a delay between the
          //   user disabling Sift for a site, and the permission-revoke API
          //   call (so content-scripts have time to receive and react to the
          //   clean up order), there was a risk that the user would close the
          //   popup before the delay ended, which would cause the permission
          //   to not actually be revoked
          const response = await browser.runtime.sendMessage({
            type: MessageType.hostPermissionsRevoked,
            data: { origins: permStrings },
          } satisfies Message);
          if ("error" in response) throw new Error(response.error);
        }
      } else {
        setPendingPerms((pps) => pps.concat(permStrings));
      }
    } catch (e) {
      // reverse the optimistic update
      setSitePerms({ ...sitePerms, [site]: isEnabled });

      handlePermissionError(e as Error);
    }
  }

  function handlePermissionError(e: Error) {
    captureException(e);
    setError(e);
  }
}
