import { useEffect, useRef, useState } from "preact/hooks";
import {
  permStringToSitename,
  supportedSites,
  type PermString,
  type Sitename,
  type SiteStatus,
  getSiteStatusOnUserToggle,
} from "./common";
import {
  browser,
  ensureError,
  ErrorMessage,
  MessageType,
  type Message,
  type SWMessageResponse,
} from "../common";
import { SWError } from "../common/customErrors";
import { captureException } from "../common/errorReporter";
import SiteChooserFormControl from "./SiteChooserFormControl";
import "./SiteChooserForm.css";

// We want to wait for the user to stop interacting with the form before
//   we disrupt the UX by triggering the permissions-grant dialog (which
//   will auto-close the popup)
const msDelayBeforeEnablingSites = 2000;

export default function SiteChooserForm() {
  const [error, setError] = useState<Error | null>(null);

  const [siteStatuses, setSiteStatuses] = useState(
    Object.keys(supportedSites).reduce(
      (acc, site) =>
        Object.assign(acc, { [site]: "disabled" } as Record<
          Sitename,
          SiteStatus
        >),
      {} as Record<Sitename, SiteStatus>,
    ),
  );

  const timeoutRef = useRef<number | null>(null);

  // update state based on perms that have already been granted
  useEffect(() => {
    (async () => {
      const previouslyGrantedHostPerms =
        ((await browser.permissions.getAll()).origins as PermString[]) ?? [];
      const previouslyEnabledSites = previouslyGrantedHostPerms.map(
        (p) => permStringToSitename[p],
      );
      const updatedStatuses = previouslyEnabledSites.reduce(
        (acc, s) => Object.assign(acc, { [s]: "enabled" }),
        {} as Record<Sitename, SiteStatus>,
      );
      setSiteStatuses((old) => ({ ...old, ...updatedStatuses }));
    })();
  }, []);

  // request perms for just-enabled sites after a delay to ensure the user
  //   has stopped interacting with the form
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const sitesToEnable = (Object.keys(siteStatuses) as Sitename[]).filter(
      (s) => siteStatuses[s] === "toEnable",
    );
    if (sitesToEnable.length === 0) return;

    timeoutRef.current = setTimeout(enableSites, msDelayBeforeEnablingSites);

    async function enableSites() {
      try {
        let granted = false;

        if (["chrome", "edge"].includes(TARGET_BROWSER)) {
          // Request perms through the SW, which is able to re-open the
          //   popup after the user interacts with the permissions-grant
          //   dialog and therefore give the best UX
          const response = await browser.runtime.sendMessage<
            Message,
            SWMessageResponse<{ granted: boolean }>
          >({
            type: MessageType.sitesEnabled,
            data: { sites: sitesToEnable },
          });
          if ("error" in response) throw new SWError(response.error);
          else ({ granted } = response.data);
        } else /* TARGET_BROWSER === "firefox" */ {
          // Firefox won't let us request perms via the SW, so we'll request
          //   them from here and settle for the inferior UX of not being able
          //   to auto-reopen the popup after the user is done with the
          //   permissions-grant dialog
          granted = await browser.permissions.request({
            origins: sitesToEnable.flatMap(
              (s) => supportedSites[s].permStrings,
            ),
          });
        }

        if (!granted) {
          throw new Error(ErrorMessage.hostPermissionNotGranted);
        }

        setSiteStatuses({
          ...siteStatuses,
          ...sitesToEnable.reduce(
            (acc, s) => Object.assign(acc, { [s]: "enabled" }),
            {} as Record<Sitename, SiteStatus>,
          ),
        });
      } catch (e) {
        ensureError(e);

        // reverse optimistic update in toggleSite
        setSiteStatuses({
          ...siteStatuses,
          ...sitesToEnable.reduce(
            (acc, s) => Object.assign(acc, { [s]: "disabled" }),
            {},
          ),
        });

        if (e.message !== ErrorMessage.hostPermissionNotGranted) {
          if (!(e instanceof SWError)) captureException(e);
          setError(e);
        }
      }
    }
  }, [siteStatuses]);

  return (
    <form className="site-chooser-form">
      <h4>What sites should Sift run on?</h4>
      {error ? <p className="error">Sorry, something went wrong ...</p> : null}

      {(Object.keys(supportedSites) as Sitename[]).map((site) => (
        <SiteChooserFormControl
          key={site}
          site={site}
          checked={["enabled", "toEnable"].includes(siteStatuses[site])}
          loading={["toEnable", "toDisable"].includes(siteStatuses[site])}
          disabled={["toDisable"].includes(siteStatuses[site])}
          onToggle={toggleSite}
        />
      ))}
    </form>
  );

  async function toggleSite(site: Sitename) {
    const curStatus = siteStatuses[site];
    if (["toDisable"].includes(curStatus)) {
      throw new Error(
        `toggleSite called when site in intermediate state: ${curStatus}`,
      );
    }

    const nextStatus = getSiteStatusOnUserToggle(curStatus);

    // optimistic state update
    setSiteStatuses({ ...siteStatuses, [site]: nextStatus });

    if (curStatus === "disabled") {
      /* User wants to enable site */
      // We've already updated state
      // Logic elsewhere will take care of requesting permissions
      return;
    }

    if (curStatus === "toEnable") {
      /* User accidentally enabled site, then tried to disable it before
           we acted on the "enable intent" */
      // We've already updated state
      // Nothing else to do
      return;
    }

    // curStatus === 'enabled'
    /* User wants to disable site */

    // The service worker will take care of removing sift from any
    //   already-open webpages associated with the perms we're about
    //   to remove
    // The code to revoke the permission could have been called from
    //   here as well, but since we want a bit of a delay between the
    //   user disabling Sift for a site, and the permission-revoke API
    //   call (so content-scripts have time to receive and react to the
    //   clean up order), there was a risk that the user would close the
    //   popup before the delay ended, which means we'd never actually
    //   get around to renouncing the permission
    const response = await browser.runtime.sendMessage<
      Message,
      SWMessageResponse<unknown>
    >({ type: MessageType.sitesDisabled, data: { sites: [site] } });
    if ("error" in response) {
      // reverse the optimistic update
      setSiteStatuses({ ...siteStatuses, [site]: curStatus });
      // this error would already have been "captured" on the SW-side
      setError(new SWError(response.error));
    } else {
      // site has been disabled
      setSiteStatuses({ ...siteStatuses, [site]: "disabled" });
    }
  }
}
