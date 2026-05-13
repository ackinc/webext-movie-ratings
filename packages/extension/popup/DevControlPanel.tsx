import { useEffect, useState } from "preact/hooks";
import { browser, sendMessageToActiveTab, MessageType } from "../common";
import Button from "../common/components/Buttons/Button";

export default function DevControlPanel() {
  const [activeTabState, setActiveTabState] = useState<{
    isRelevant: boolean;
    loopIsRunning: boolean;
    inSelectProgramMode: boolean;
  }>({
    isRelevant: false,
    loopIsRunning: true,
    inSelectProgramMode: false,
  });

  useEffect(() => {
    (async () => {
      const [tab] = await browser.tabs.query({ active: true });
      if (!tab?.url) {
        return setActiveTabState((x) => ({
          ...x,
          isRelevant: false,
          loopIsRunning: false,
        }));
      }

      const [loopStateQueryResult, selectProgramModeQueryResult] =
        await Promise.all([
          sendMessageToActiveTab<"started" | "stopped">({
            type: MessageType.getActiveTabLoopState,
          }),
          sendMessageToActiveTab<"on" | "off">({
            type: MessageType.getSelectProgramModeState,
          }),
        ]);
      setActiveTabState({
        isRelevant: true,
        loopIsRunning: loopStateQueryResult === "started",
        inSelectProgramMode: selectProgramModeQueryResult === "on",
      });
    })();
  }, []);

  return (
    <div
      className="dev-control-panel"
      style={{
        marginBottom: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <Button
        variant="primary"
        disabled={!activeTabState.isRelevant}
        onClick={() => {
          sendMessageToActiveTab({
            type: MessageType.toggleActiveTabLoopState,
          });
          setActiveTabState((x) => ({ ...x, loopIsRunning: !x.loopIsRunning }));
        }}
      >
        {activeTabState.loopIsRunning ? "Stop" : "Start"} loop
      </Button>

      <Button
        variant="primary"
        disabled={!activeTabState.isRelevant}
        onClick={() => {
          sendMessageToActiveTab({
            type: MessageType.toggleSelectProgramMode,
          });
          setActiveTabState((x) => ({
            ...x,
            inSelectProgramMode: !x.inSelectProgramMode,
          }));
        }}
      >
        {activeTabState.inSelectProgramMode
          ? "Click on a program to select it ..."
          : "Examine a program node"}
      </Button>
    </div>
  );
}
