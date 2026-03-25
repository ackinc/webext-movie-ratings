import { useEffect, useRef, useState } from "preact/hooks";
import {
  permStringToSitename,
  supportedSites,
  type PermString,
  type Sitename,
} from "./common";
import {
  browser,
  ensureError,
  ErrorMessage,
  MessageType,
  type Message,
  type SWMessageResponse,
} from "../common";
import { captureException } from "../common/errorReporter";
import SiteChooserFormControl from "./SiteChooserFormControl";
import "./SiteChooserForm.css";

type IsEnabled = boolean;
const msDelayBeforeEnablingSites = 2000;

export default function SiteChooserForm() {
  const [error, setError] = useState<Error | null>(null);

  const [enabledSites, setEnabledSites] = useState(
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
  //   in quick succession would be absolutely horrible
  const [sitesToEnable, setSitesToEnable] = useState<Sitename[]>([]);
  const timeoutRef = useRef<number | null>(null);

  // update state based on perms that have already been granted
  useEffect(() => {
    (async () => {
      const previouslyGrantedHostPerms =
        ((await browser.permissions.getAll()).origins as PermString[]) ?? [];
      const previouslyEnabledSites = previouslyGrantedHostPerms.reduce(
        (acc, o) => Object.assign(acc, { [permStringToSitename[o]]: true }),
        {},
      );
      setEnabledSites((old) => ({ ...old, ...previouslyEnabledSites }));
    })();
  }, []);

  // request perms for just-enabled sites after a delay to ensure the user
  //   has stopped interacting with the form
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (sitesToEnable.length === 0) return;
    timeoutRef.current = setTimeout(enableSites, msDelayBeforeEnablingSites);

    async function enableSites() {
      try {
        const granted = await browser.permissions.request({
          origins: sitesToEnable.flatMap((s) => supportedSites[s].permStrings),
        });
        if (!granted) throw new Error(ErrorMessage.hostPermissionNotGranted);
      } catch (e) {
        ensureError(e);

        // reverse optimistic update in toggleSite
        setEnabledSites((prev) => ({
          ...prev,
          ...sitesToEnable.reduce(
            (acc, s) => Object.assign(acc, { [s]: false }),
            {},
          ),
        }));

        if (e.message !== ErrorMessage.hostPermissionNotGranted) {
          handlePermissionError(e);
        }
      } finally {
        setSitesToEnable([]);
      }
    }
  }, [sitesToEnable]);

  return (
    <form className="site-chooser-form">
      <h4>What sites should Sift run on?</h4>
      {error ? <p className="error">Sorry, something went wrong ...</p> : null}

      {(Object.keys(supportedSites) as Sitename[]).map((site) => (
        <SiteChooserFormControl
          key={site}
          site={site}
          enabled={enabledSites[site]}
          loading={sitesToEnable.includes(site)}
          onToggle={toggleSite}
        />
      ))}
    </form>
  );

  async function toggleSite(site: Sitename) {
    const isEnabled = enabledSites[site];

    // optimistic update
    setEnabledSites({ ...enabledSites, [site]: !isEnabled });

    if (!isEnabled) {
      /* User wants to enable site */
      setSitesToEnable(sitesToEnable.concat(site));
      return;
    }

    /* User wants to disable site */

    // The user may enable Sift for a site by accident, then quickly
    //   correct that mistake by disabling it before we've had time
    //   to request the necessary permissions
    // In this situation, all that needs to be done is to remove the
    //   site in question from sitesToEnable
    if (sitesToEnable.includes(site)) {
      setSitesToEnable(sitesToEnable.filter((s) => s !== site));
      return;
    }

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
      setEnabledSites({ ...enabledSites, [site]: isEnabled });
      return;
    }
  }

  function handlePermissionError(e: Error) {
    captureException(e);
    setError(e);
  }
}
