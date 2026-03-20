import type { Sitename } from "../common";

interface OnboardingFlowFinishedPageProps {
  sitesToEnable: Sitename[];
}

export default function OnboardingFlowFinishedPage({
  sitesToEnable,
}: OnboardingFlowFinishedPageProps) {
  console.log(sitesToEnable);
  return <div className="onboarding-flow-finished-page">You're all set!</div>;

  async function handleOnboardingFinish(_sitesToEnable: Sitename[]) {
    // TODO
    // persist onboarding-finished value in storage

    setCurPage("filters");
    // revoke perms as appropriate

    // Iff sites were added, show toast "Please accept the
    //   permission grant request that will appear shortly"

    await delayMs(2000);

    // request perms as appropriate (will cause popup to disappear)
  }
}
