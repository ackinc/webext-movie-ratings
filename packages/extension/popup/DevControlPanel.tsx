import { useEffect, useState } from "preact/hooks";
import { browser, sendMessageToActiveTab, MessageType } from "../common";
import Button from "./Buttons/Button";

export default function DevControlPanel() {
  const [activeTabState, setActiveTabState] = useState<{
    isRelevant: boolean;
    loopIsRunning: boolean;
  }>({
    isRelevant: false,
    loopIsRunning: true,
  });

  useEffect(() => {
    (async () => {
      const [tab] = await browser.tabs.query({ active: true });
      if (!tab?.url) {
        return setActiveTabState({ isRelevant: false, loopIsRunning: false });
      }

      const result = await sendMessageToActiveTab<"started" | "stopped">({
        type: MessageType.getActiveTabLoopState,
      });
      setActiveTabState({
        isRelevant: true,
        loopIsRunning: result === "started",
      });
    })();
  }, []);

  return (
    <div
      className="dev-control-panel flex-center-content"
      style={{ marginBottom: "16px" }}
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
    </div>
  );
}
