import { useState } from "preact/hooks";
import WelcomePage from "./WelcomePage";
import PitchErrorReportingOptInPage from "./PitchErrorReportingPage";
import OnboardingFlowFinishedPage from "./OnboardingFlowFinishedPage";
import type { Sitename } from "../common";
import "./OnboardingFlow.css";

type OnboardingFlowPage =
  | "welcome"
  | "pitchErrorReporting"
  | "onboardingFinished";

export default function OnboardingFlow() {
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
      {curPage === "onboardingFinished" ? (
        <OnboardingFlowFinishedPage sitesToEnable={selectedSites} />
      ) : null}

      {curPage !== "onboardingFinished" ? (
        <button className="next-button" onClick={handleNextButtonClick}>
          Next
        </button>
      ) : null}
    </div>
  );

  function handleNextButtonClick() {
    if (curPage === "welcome") {
      setCurPage("pitchErrorReporting");
    } else if (curPage === "pitchErrorReporting") {
      setCurPage("onboardingFinished");
    }
  }
}
