import { useState } from "preact/hooks";
import WelcomePage from "./WelcomePage";
import PitchErrorReportingOptInPage from "./PitchErrorReportingPage";
import OnboardingFlowFinishedPage from "./OnboardingFlowFinishedPage";
import type { Sitename } from "../common";
import { getSetting } from "../../common";
import "./OnboardingFlow.css";

type OnboardingFlowPage = "welcome" | "pitchErrorReporting" | "finished";

interface OnboardingFlowProps {
  onFinish: () => void;
}

export default function OnboardingFlow({ onFinish }: OnboardingFlowProps) {
  const [curPage, setCurPage] = useState<OnboardingFlowPage>("welcome");
  const [selectedSites, setSelectedSites] = useState<Sitename[]>([]);

  return (
    <div className="onboarding-flow">
      {curPage === "welcome" ? (
        <WelcomePage
          selectedSites={selectedSites}
          setSelectedSites={setSelectedSites}
        />
      ) : null}
      {curPage === "pitchErrorReporting" ? (
        <PitchErrorReportingOptInPage />
      ) : null}
      {curPage === "finished" ? (
        <OnboardingFlowFinishedPage
          sitesToEnable={selectedSites}
          onFinish={onFinish}
        />
      ) : null}

      <button
        className="next-button"
        disabled={curPage === "finished"}
        onClick={handleNextButtonClick}
      >
        {curPage === "finished" ? "Please wait ..." : "Next"}
      </button>
    </div>
  );

  async function handleNextButtonClick() {
    if (curPage === "welcome") {
      const alreadyOptedInToErrorReporting = await getSetting(
        "errorReportingOptIn",
      );
      setCurPage(
        alreadyOptedInToErrorReporting ? "finished" : "pitchErrorReporting",
      );
    } else if (curPage === "pitchErrorReporting") {
      setCurPage("finished");
    }
  }
}
