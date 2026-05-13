import { useEffect, useState } from "preact/hooks";
import WelcomePage from "./WelcomePage";
import PitchErrorReportingOptInPage from "../PitchErrorReportingPage";
import CheckAndRequestPermissionsPage from "./CheckAndRequestPermissionsPage";
import CheckAndDisplayPermissionStatusPage from "./CheckAndDisplayPermissionStatusPage";
import type { PermString, Sitename } from "../common";
import {
  browser,
  getSetting,
  permStringToSitename,
  setSetting,
} from "../../common";
import Button from "../../common/components/Buttons/Button";
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

  // put the user on the right page within onboarding
  useEffect(() => {
    (async () => {
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

  // update state based on the user's previous activity (if existing user)
  useEffect(() => {
    (async () => {
      const existingPerms = (await browser.permissions.getAll()).origins ?? [];
      const alreadyEnabledSites = (existingPerms as PermString[]).map(
        (p) => permStringToSitename[p],
      );
      const errorReportingOptedIn =
        (await getSetting("errorReportingOptIn")) ?? false;

      setSelectedSites(alreadyEnabledSites);
      setErrorReportingOptedIn(errorReportingOptedIn);
    })();
  }, []);

  useEffect(() => {
    setError(null);
  }, [selectedSites]);

  useEffect(() => {
    if (curPage === "pitchErrorReporting") {
      setSetting("onboardingStatus", "pitchedErrorReporting");
    }
  }, [curPage]);

  return (
    <div className="onboarding-flow">
      {curPage === "welcome" ? (
        <WelcomePage selectedSites={selectedSites} toggleSite={toggleSite} />
      ) : curPage === "checkAndRequestPermissions" ? (
        <CheckAndRequestPermissionsPage
          sitesToEnable={selectedSites}
          onFinish={gotoNext}
        />
      ) : curPage === "checkAndDisplayPermissionStatus" ? (
        <CheckAndDisplayPermissionStatusPage />
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

  function toggleSite(site: Sitename) {
    setSelectedSites((ss) =>
      ss.includes(site) ? ss.filter((s) => s !== site) : ss.concat(site),
    );
  }
}
