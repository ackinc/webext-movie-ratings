import { useEffect, useState } from "preact/hooks";
import WelcomePage from "./WelcomePage";
import PitchErrorReportingOptInPage from "./PitchErrorReportingPage";
import CheckAndRequestPermissionsPage from "./CheckAndRequestPermissionsPage";
import CheckAndDisplayPermissionStatus from "./CheckAndDisplayPermissionStatus";
import type { Sitename } from "../common";
import { getSetting, setSetting } from "../../common";
import Button from "../Buttons/Button";
import "./OnboardingFlow.css";

type OnboardingFlowPage =
  | "welcome"
  | "checkAndRequestPermissions"
  | "checkAndDisplayPermissionStatus"
  | "pitchErrorReporting";

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
        setCurPage("checkAndDisplayPermissionStatus");
      } else if (onboardingStatus === "displayedPermissionStatus") {
        setCurPage("checkAndDisplayPermissionStatus");
      } else if (onboardingStatus === "pitchedErrorReporting") {
        setCurPage("pitchErrorReporting");
      } else if (onboardingStatus === "finished") {
        onFinish();
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
      ) : curPage === "checkAndRequestPermissions" ? (
        <CheckAndRequestPermissionsPage
          sitesToEnable={selectedSites}
          onFinish={gotoNext}
        />
      ) : curPage === "checkAndDisplayPermissionStatus" ? (
        <CheckAndDisplayPermissionStatus />
      ) : (
        <PitchErrorReportingOptInPage onFinish={gotoNext} />
      )}

      {curPage !== "checkAndRequestPermissions" ? (
        <Button className="btn-next" onClick={gotoNext} variant="primary">
          {curPage === "pitchErrorReporting" ? "Finish" : "Next"}
        </Button>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
    </div>
  );

  async function gotoNext() {
    if (curPage === "welcome") {
      if (selectedSites.length === 0) {
        setError("Please select at least one site.");
      } else {
        setCurPage("checkAndRequestPermissions");
      }
    } else if (curPage === "checkAndRequestPermissions") {
      setCurPage("checkAndDisplayPermissionStatus");
    } else if (curPage === "checkAndDisplayPermissionStatus") {
      setCurPage("pitchErrorReporting");
    } else {
      await setSetting("onboardingStatus", "finished");
      onFinish();
    }
  }
}
