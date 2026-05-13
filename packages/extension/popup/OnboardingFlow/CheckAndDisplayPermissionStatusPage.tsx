import { useEffect, useState } from "preact/hooks";
import { browser, CssColors, setSetting } from "../../common";
import CheckmarkOnCircle from "../Icons/CheckmarkOnCircle";
import SettingsIcon from "@/images/settings.svg";
import LoadingIndicator from "@/images/loading.svg";

export default function CheckAndDisplayPermissionStatusPage() {
  const [state, setState] = useState<{
    status: "checking" | "permsDenied" | "permsGranted";
  }>({ status: "checking" });

  useEffect(() => {
    helper();

    async function helper() {
      await setSetting("onboardingStatus", "displayedPermissionStatus");

      // Check whether the user granted or denied the perms request
      // An existing user will never even be asked to grant perms,
      //   because the pre-onboarding version of the extension they
      //   were using already had all possible host perms
      // For new users, if they denied the perms request,

      const grantedHostPerms =
        (await browser.permissions.getAll()).origins ?? [];
      if (grantedHostPerms.length === 0) setState({ status: "permsDenied" });
      else setState({ status: "permsGranted" });
    }
  }, []);

  return (
    <div className="page check-and-display-permission-status-page">
      <div
        className={`loading-overlay overlay flex-center-content ${state.status === "checking" ? "" : "hidden"}`}
      >
        <img src={LoadingIndicator} alt="loading" />
        <p>Please wait ...</p>
      </div>

      <div className={`hero ${state.status === "checking" ? "invisible" : ""}`}>
        <CheckmarkOnCircle
          style={
            state.status === "permsDenied"
              ? { fill: CssColors.failureBg, transform: "rotateX(180deg)" }
              : { fill: CssColors.successBg }
          }
        />
        {state.status === "permsDenied" ? (
          <h1>Uh oh ...</h1>
        ) : (
          <h1>Alright!</h1>
        )}
      </div>

      {state.status === "permsDenied" ? (
        <>
          <p>
            It looks like Sift has been denied permissions to operate on any OTT
            websites. That's ok.
          </p>

          <p>
            If you change your mind, you can enable Sift on specific sites from{" "}
            <span>
              <img src={SettingsIcon} className="inline-icon" />
              <b>Settings</b>
            </span>
          </p>
        </>
      ) : state.status === "permsGranted" ? (
        <p>
          Ratings will automatically show up on the OTT websites you selected
          earlier.
        </p>
      ) : null}
    </div>
  );
}
