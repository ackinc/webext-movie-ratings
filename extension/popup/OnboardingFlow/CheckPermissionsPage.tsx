import { useEffect, useState } from "preact/hooks";
import { type PermString, supportedSites, type Sitename } from "../common";
import {
  addBadge,
  browser,
  MessageType,
  setSetting,
  type Message,
} from "../../common";
import Button from "../Buttons/Button";
import permsNeededImg from "../../../images/whiteExclamationInOrangeCircle.svg";

interface PageProps {
  sitesToEnable: Sitename[];
  onFinish: () => void;
}

type PageState =
  | { status: "checking" }
  | { status: "permGrantNeeded"; perms: PermString[] };

export default function OnboardingFlowFinishedPage({
  sitesToEnable,
  onFinish,
}: PageProps) {
  const [state, setState] = useState<PageState>({ status: "checking" });

  useEffect(() => {
    (async () => {
      // This check is unnecessary in production, but is useful to force
      //   the component into one of the ephemeral states during development
      //   for debugging / UI fixes, so I'm leaving it in
      if (state.status !== "checking") return;

      const permsNeeded = new Set(
        sitesToEnable.flatMap((site) => supportedSites[site].permStrings),
      );

      const permsAlreadyGranted = new Set<PermString>(
        (await browser.permissions.getAll()).origins as
          | PermString[]
          | undefined,
      );

      // Renounce unneeded perms
      const permsToRevoke = Array.from(permsAlreadyGranted).filter(
        (p) => !permsNeeded.has(p),
      );
      if (permsToRevoke.length > 0) {
        await browser.runtime.sendMessage({
          type: MessageType.hostPermissionsRevoked,
          data: { origins: permsToRevoke },
        } satisfies Message);
      }

      const permsToRequest = Array.from(permsNeeded).filter(
        (p) => !permsAlreadyGranted.has(p),
      );
      if (permsToRequest.length > 0) {
        setState({ status: "permGrantNeeded", perms: permsToRequest });
      } else {
        // nothing to do - we already have all the perms we need
        onFinish();
      }
    })();
  }, []);

  if (state.status === "checking") return null;
  return (
    <div className="page check-permissions-page">
      <div className="hero">
        <img src={permsNeededImg} alt="Permissions needed" />

        <p>
          Click the button below to grant Sift the permissions needed to operate
          on the sites you selected earlier.
        </p>

        <Button variant="primary" onClick={handleGrantPermissionsButtonClick}>
          Grant permissions
        </Button>
      </div>
    </div>
  );

  async function handleGrantPermissionsButtonClick() {
    if (state.status !== "permGrantNeeded") return;

    // We need to get the user to re-open the popup after the browser's
    //   permissions dialog forces it to disappear
    // Add a badge to indicate to the user that they should open the
    //   extension popup again
    await addBadge("!");

    await setSetting("onboardingStatus", "askedUserForPermissions");

    await browser.permissions.request({ origins: state.perms });
  }
}
