// this module is for more complex helper fns

import { browser } from "./constants";
import type { Message } from "./types";
import { pick } from "./utils";
import { captureException } from "./errorReporter";

export async function sendMessageToAllTabs(message: Message) {
  const tabs = await browser.tabs.query({
    url: browser.runtime.getManifest()["host_permissions"],
  });
  const results = await Promise.allSettled(
    tabs.map((tab) => browser.tabs.sendMessage(tab.id as number, message)),
  );
  results.forEach((result, idx) => {
    if (result.status === "fulfilled") return;

    const tab = tabs[idx]!;
    const { reason } = result;
    if (reason.message.includes("Receiving end does not exist")) return;
    reason.message = `Failed to send message to tab. ${reason.message}`;
    captureException(reason, {
      context: {
        tab: pick(tab as unknown as Record<string, unknown>, ["id", "url"]),
        message,
      },
    });
  });
  return results.map((result, idx) => ({ tab: tabs[idx]!, result }));
}
