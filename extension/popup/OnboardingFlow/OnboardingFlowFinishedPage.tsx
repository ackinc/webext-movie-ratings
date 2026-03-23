import { useEffect, useState } from "preact/hooks";
import { type PermString, supportedSites, type Sitename } from "../common";
import {
  browser,
  delayMs,
  MessageType,
  type Message,
  setSetting,
} from "../../common";
import "./OnboardingFlowFinishedPage.css";
import onboardingSuccessImg from "../../../images/whiteCheckInGreenCircle.svg";
import onboardingWarningImg from "../../../images/whiteExclamationInOrangeCircle.svg";

interface PageProps {
  sitesToEnable: Sitename[];
  onFinish: () => void;
}

type PageState =
  | { status: "checking" }
  | { status: "permGrantNeeded"; perms: PermString[] }
  | { status: "allSet" };

export default function OnboardingFlowFinishedPage({
  sitesToEnable,
  onFinish,
}: PageProps) {
  const [state, setState] = useState<PageState>({ status: "checking" });

  useEffect(() => {
    (async () => {
      // This check is unnecessary in production, but is useful to force the component
      //   into one of the ephemeral states during development for debugging / UI fixes,
      //   so I'm leaving it in
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

      // Request needed perms we don't already have
      // The popup will auto-disappear when the browser's permission warning
      //   shows up
      const permsToRequest = Array.from(permsNeeded).filter(
        (p) => !permsAlreadyGranted.has(p),
      );
      if (permsToRequest.length > 0) {
        setState({ status: "permGrantNeeded", perms: permsToRequest });
      } else {
        setState({ status: "allSet" });
      }

      // Persist a flag in storage so we don't make the user go through
      //   onboarding again
      // This should ideally be done after needed permissions are requested,
      //   but because the browser's permission warning dialog auto-closes the
      //   popup, the flag would never be set
      await setSetting("onboardingFinished", true);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (state.status === "permGrantNeeded") {
        await delayMs(3000); // give time to the user to read the CTA
        await browser.permissions.request({ origins: state.perms });
      } else if (state.status === "allSet") {
        await delayMs(2000);
        onFinish();
      }
    })();
  }, [state]);

  return (
    <div className="page flow-finished-page">
      {state.status === "checking" ? null : (
        <img
          src={
            state.status === "permGrantNeeded"
              ? onboardingWarningImg
              : onboardingSuccessImg
          }
          alt={
            state.status === "permGrantNeeded"
              ? "Permissions needed"
              : "All set"
          }
        />
      )}
      {state.status === "checking" ? null : state.status ===
        "permGrantNeeded" ? (
        <p className="perm-grant-cta">
          Please accept the permissions request in the system dialog that will
          be displayed shortly ...
        </p>
      ) : (
        <p className="success">You're all set!</p>
      )}
    </div>
  );
}
