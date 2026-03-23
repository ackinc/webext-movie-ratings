import { useEffect, useState } from "preact/hooks";
import { browser, removeBadge, setSetting } from "../../common";
import SettingsIcon from "../../../images/settings.svg";
import onboardingSuccessImg from "../../../images/whiteCheckInGreenCircle.svg";

export default function OnboardingFlowFinishedPage() {
  const [status, setStatus] = useState<
    "checking" | "permsDenied" | "permsGranted"
  >("checking");

  useEffect(() => {
    (async () => {
      // Once the user reaches this page, we want to make sure they're not
      //   made to go through onboarding again, even if they don't click
      //   the onboarding flow's 'finish' button explicitly
      await setSetting("onboardingStatus", "finished");
      await removeBadge();

      // check whether the user granted or denied the perms request
      // an existing user will never even be asked to grant perms,
      //   because the pre-onboarding version of the extension they
      //   were using already had all possible host perms
      // for new users, if they denied the perms request,

      const grantedHostPerms =
        (await browser.permissions.getAll()).origins ?? [];
      if (grantedHostPerms.length === 0) setStatus("permsDenied");
      else setStatus("permsGranted");
    })();
  }, []);

  if (status === "checking") return null;
  return (
    <div className="page flow-finished-page">
      <div className="hero">
        <img
          src={onboardingSuccessImg}
          style={{
            transform: status === "permsDenied" ? "rotateX(180deg)" : "none",
          }}
        />
        {status === "permsGranted" ? (
          <h1>You're all set!</h1>
        ) : (
          <h1>Whoops ...</h1>
        )}
      </div>

      {status === "permsDenied" ? (
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
      ) : (
        <>
          <p>
            Ratings will automatically show up on the OTT websites you selected
            earlier.
          </p>

          <p>
            The next page will let you add filters to hide low-rated programs
            when you're browsing these sites.
          </p>

          <p>Have fun using Sift!</p>
        </>
      )}
    </div>
  );
}
