import { useEffect, useState } from "preact/hooks";
import {
  browser,
  CssColors,
  MessageType,
  setSetting,
  supportedSites,
  type Message,
  type PermString,
  type Sitename,
} from "@common";
import Button from "@common/components/Buttons/Button";
import ExclmarkOnCircle from "@popup/components/Icons/ExclmarkOnCircle";
import LoadingIndicator from "@images/loading.svg";

interface PageProps {
  sitesToEnable: Sitename[];
  onFinish: () => void;
}

type PageState =
  | { status: "checking" }
  | { status: "permGrantNeeded"; perms: PermString[] };

export default function CheckAndRequestPermissionsPage({
  sitesToEnable,
  onFinish,
}: PageProps) {
  const [state, setState] = useState<PageState>({ status: "checking" });

  useEffect(() => {
    helper();

    async function helper() {
      // renounce perms for any sites where the user doesn't wants Sift
      const sitesToDisable = (Object.keys(supportedSites) as Sitename[]).filter(
        (site) => !sitesToEnable.includes(site),
      );
      if (sitesToDisable.length > 0) {
        await browser.runtime.sendMessage({
          type: MessageType.sitesDisabled,
          data: { sites: sitesToDisable },
        } satisfies Message);
      }

      const permsNeeded = new Set(
        sitesToEnable.flatMap((site) => supportedSites[site].permStrings),
      );

      const permsAlreadyGranted = new Set<PermString>(
        (await browser.permissions.getAll()).origins as
          | PermString[]
          | undefined,
      );

      const permsToRequest = Array.from(permsNeeded).filter(
        (p) => !permsAlreadyGranted.has(p),
      );
      if (permsToRequest.length > 0) {
        setState({ status: "permGrantNeeded", perms: permsToRequest });
      } else {
        // nothing to do - we already have all the perms we need
        onFinish();
      }
    }
  }, []);

  return (
    <div className="page check-and-request-permissions-page">
      <div
        className={`loading-overlay overlay flex-center-content ${state.status === "checking" ? "" : "hidden"}`}
      >
        <img src={LoadingIndicator} alt="loading" />
        <p>Please wait ...</p>
      </div>

      <div className={`hero ${state.status === "checking" ? "invisible" : ""}`}>
        <ExclmarkOnCircle style={{ fill: CssColors.mainBgColor }} />

        <p>
          Sift needs additional permissions to operate on the sites you
          selected.
        </p>

        <Button variant="primary" onClick={handleGrantPermissionsButtonClick}>
          Grant permissions
        </Button>
      </div>
    </div>
  );

  async function handleGrantPermissionsButtonClick() {
    if (state.status !== "permGrantNeeded") return;

    if (TARGET_BROWSER === "firefox") {
      // can't have anything async before permissions.request call
      //   in firefox
      setSetting("onboardingStatus", "askedUserForPermissions");
      await browser.permissions.request({ origins: state.perms });
    } else {
      await setSetting("onboardingStatus", "askedUserForPermissions");
      await browser.runtime.sendMessage({
        type: MessageType.sitesEnabled,
        data: { sites: sitesToEnable },
      } satisfies Message);
    }
    onFinish();
  }
}
