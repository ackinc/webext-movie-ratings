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

interface OnboardingFlowFinishedPageProps {
  sitesToEnable: Sitename[];
  onFinish: () => void;
}

export default function OnboardingFlowFinishedPage({
  sitesToEnable,
  onFinish,
}: OnboardingFlowFinishedPageProps) {
  const [state, setState] = useState<"checking" | "permGrantNeeded" | "allSet">(
    "checking",
  );

  useEffect(() => {
    (async () => {
      // This check is unnecessary in production, but is useful to force the component
      //   into one of the ephemeral states during development for debugging / UI fixes,
      //   so I'm leaving it in
      if (state !== "checking") return;

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

      // Persist a flag in storage so we don't make the user go through
      //   onboarding again
      // This should ideally be done after needed permissions are requested
      //   (done below), but because the browser's permission warning dialog
      //   auto-closes the popup, the flag would never be set
      await setSetting("onboardingFinished", true);

      // Request needed perms we don't already have
      // The popup will auto-disappear when the browser's permission warning
      //   shows up
      const permsToRequest = Array.from(permsNeeded).filter(
        (p) => !permsAlreadyGranted.has(p),
      );
      if (permsToRequest.length === 0) {
        setState("allSet");
        return;
      }

      setState("permGrantNeeded");
      await delayMs(3000);
      await browser.permissions.request({ origins: permsToRequest });

      // We'll only get here if:
      // 1. No perm warning dialog is thrown up by the browser (won't happen
      //    see below)
      //    - This never happens in FF, and can only happen in chrome if the
      //      perms we're asking for were previously granted, then revoked
      //    - Pre-onboarding Sift required all host perms at install-time,
      //      and the only way for a pre-onboarding Sift user to revoke a perm
      //      is via the chrome://extensions interface
      //    - I wanted to check if the user doing that would put us in a
      //      situation where, if they re-enabled Sift for that site during
      //      onboarding, the perm would be granted without the permissions dialog
      //      showing up
      //      - It wasn't. The permission dialog *did* show up. It seems revoking
      //        a perm from the chrome://extensions interface is not the same as
      //        doing it from inside the extension's UI
      // 2. The popup remained open even after the perm warning dialog
      //    was thrown up (never happens see below)
      //    - doesn't happen in chrome or firefox
      // So basically we'll never get here
      setState("allSet");
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (state !== "allSet") return;
      await delayMs(2000);
      onFinish();
    })();
  }, [state]);

  return (
    <div className="page flow-finished-page">
      {state === "checking" ? null : (
        <img
          src={
            state === "permGrantNeeded"
              ? onboardingWarningImg
              : onboardingSuccessImg
          }
          alt={state === "permGrantNeeded" ? "Permissions needed" : "All set"}
        />
      )}
      {state === "checking" ? null : state === "permGrantNeeded" ? (
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
