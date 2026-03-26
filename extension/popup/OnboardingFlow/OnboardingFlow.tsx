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
  const [errorReportingOptedIn, setErrorReportingOptedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const errorReportingOptedIn =
        (await getSetting("errorReportingOptIn")) ?? false;
      setErrorReportingOptedIn(errorReportingOptedIn);

      const onboardingStatus = await getSetting("onboardingStatus");
      if (onboardingStatus === "askedUserForPermissions") {
        setCurPage("checkAndDisplayPermissionStatus");
      } else if (onboardingStatus === "displayedPermissionStatus") {
        setCurPage("checkAndDisplayPermissionStatus");
      } else if (onboardingStatus === "pitchedErrorReporting") {
        if (errorReportingOptedIn) onFinish();
        else setCurPage("pitchErrorReporting");
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
        <PitchErrorReportingOptInPage />
      )}

      {curPage !== "checkAndRequestPermissions" ? (
        <Button className="btn-next" onClick={gotoNext} variant="primary">
          {curPage === "pitchErrorReporting" ||
          (errorReportingOptedIn &&
            curPage === "checkAndDisplayPermissionStatus")
            ? "Finish"
            : "Next"}
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
      return;
    }

    if (curPage === "checkAndRequestPermissions") {
      setCurPage("checkAndDisplayPermissionStatus");
      return;
    }

    if (curPage === "checkAndDisplayPermissionStatus") {
      if (errorReportingOptedIn) {
        await setSetting("onboardingStatus", "finished");
        onFinish();
      } else {
        setCurPage("pitchErrorReporting");
      }
      return;
    }

    await setSetting("onboardingStatus", "finished");
    onFinish();
  }
}
