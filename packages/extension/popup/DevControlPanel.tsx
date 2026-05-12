import { useEffect, useState } from "preact/hooks";
import { browser, sendMessageToActiveTab, MessageType } from "../common";
import Button from "./Buttons/Button";

export default function DevControlPanel() {
  const [activeTabIsRelevant, setActiveTabIsRelevant] = useState(false);

  useEffect(() => {
    (async () => {
      const [tab] = await browser.tabs.query({ active: true });
      setActiveTabIsRelevant(Boolean(tab?.url));
    })();
  }, []);

  return (
    <div
      className="dev-control-panel flex-center-content"
      style={{ marginBottom: "16px" }}
    >
      <Button
        variant="primary"
        disabled={!activeTabIsRelevant}
        onClick={() =>
          sendMessageToActiveTab({ type: MessageType.toggleActiveTabLoopState })
        }
      >
        Toggle loop
      </Button>
    </div>
  );
}
