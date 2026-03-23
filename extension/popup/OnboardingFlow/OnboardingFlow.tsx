import { useEffect, useState } from "preact/hooks";
import WelcomePage from "./WelcomePage";
import PitchErrorReportingOptInPage from "./PitchErrorReportingPage";
import CheckPermissionsPage from "./CheckPermissionsPage";
import OnboardingFlowFinishedPage from "./OnboardingFlowFinishedPage";
import type { Sitename } from "../common";
import { getSetting } from "../../common";
import Button from "../Buttons/Button";
import "./OnboardingFlow.css";

type OnboardingFlowPage =
  | "welcome"
  | "pitchErrorReporting"
  | "checkPermissions"
  | "finished";

interface OnboardingFlowProps {
  onFinish: () => void;
}

export default function OnboardingFlow({ onFinish }: OnboardingFlowProps) {
  const [curPage, setCurPage] = useState<OnboardingFlowPage>("welcome");
  const [selectedSites, setSelectedSites] = useState<Sitename[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const onboardingStatus = await getSetting("onboardingStatus");
      if (onboardingStatus === "askedUserForPermissions") {
        setCurPage("finished");
      }
    })();
  }, []);

  useEffect(() => {
    setError(null);
  }, [selectedSites]);

  return (
    <div className="onboarding-flow">
      {curPage === "welcome" ? (
        <WelcomePage
          selectedSites={selectedSites}
          setSelectedSites={setSelectedSites}
        />
      ) : curPage === "pitchErrorReporting" ? (
        <PitchErrorReportingOptInPage onFinish={gotoNext} />
      ) : curPage === "checkPermissions" ? (
        <CheckPermissionsPage
          sitesToEnable={selectedSites}
          onFinish={gotoNext}
        />
      ) : (
        <OnboardingFlowFinishedPage />
      )}

      <Button
        className="btn-next"
        disabled={curPage === "checkPermissions"}
        onClick={gotoNext}
        variant="primary"
      >
        {curPage === "finished" ? "Finish" : "Next"}
      </Button>

      {error ? <p className="error">{error}</p> : null}
    </div>
  );

  async function gotoNext() {
    if (curPage === "welcome") {
      if (selectedSites.length === 0) {
        setError("Please select at least one site.");
      } else {
        setCurPage("pitchErrorReporting");
      }
    } else if (curPage === "pitchErrorReporting") {
      setCurPage("checkPermissions");
    } else if (curPage === "checkPermissions") {
      setCurPage("finished");
    } else {
      onFinish();
    }
  }
}
