import { useEffect } from "preact/hooks";
import { removeBadge, setSetting } from "../../common";
import onboardingSuccessImg from "../../../images/whiteCheckInGreenCircle.svg";

export default function OnboardingFlowFinishedPage() {
  useEffect(() => {
    (async () => {
      // Once the user reaches this page, we want to make sure they're not made
      //   to go through onboarding again, even if they don't click the onboarding
      //   flow's 'finish' button explicitly
      await setSetting("onboardingFinished", true);
      await removeBadge();
    })();
  }, []);

  return (
    <div className="page flow-finished-page">
      <div className="hero">
        <img src={onboardingSuccessImg} alt="All set" />
        <h1>You're all set!</h1>
      </div>

      <p>
        Ratings will automatically show up on the OTT websites you selected
        earlier.
      </p>

      <p>
        The next page will let you add filters to hide low-rated programs when
        you're browsing these sites.
      </p>

      <p>Have fun using Sift!</p>
    </div>
  );
}
