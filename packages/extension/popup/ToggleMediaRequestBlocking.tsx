import { useEffect, useState } from "preact/hooks";
import {
  browser,
  getSetting,
  setSetting,
  MessageType,
  type Message,
  type SWMessageResponse,
} from "../common";
import CheckboxInput from "./Inputs/CheckboxInput";

export default function ToggleMediaRequestBlocking() {
  const [enabled, setEnabled] = useState(false);

  // load initial state
  useEffect(() => {
    (async () => {
      const isEnabled = Boolean(
        await getSetting("mediaRequestBlockingEnabled"),
      );
      setEnabled(isEnabled);
    })();
  }, []);

  return (
    <CheckboxInput
      name="enable-media-request-blocking"
      label="Block media requests?"
      checked={enabled}
      onChange={handleChange}
      className="enable-media-request-blocking"
    />
  );

  async function handleChange() {
    const response = await browser.runtime.sendMessage<
      Message,
      SWMessageResponse<{ enabled: boolean }>
    >({
      type: MessageType.setMediaRequestBlockingState,
      data: { value: !enabled },
    });
    if ("error" in response) throw new Error(response.error);

    const isEnabled = response.data.enabled;
    setSetting("mediaRequestBlockingEnabled", isEnabled);
    setEnabled(isEnabled);
  }
}
