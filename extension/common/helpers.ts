// this module is for more complex helper fns

import { browser, languages } from "./constants";
import type { ExtensionSettings, Message } from "./types";
import { pick } from "../../utils";
import { captureException } from "./errorReporter";
import * as storage from "./storage";

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

export function extractProgramTitle(str: string): string {
  let title = str.trim();

  const toRemove = [
    "New TV Show",
    "TV Show",
    "TV Series",
    "Web Series",
    "Webseries",
    // removes suffixes like "Season 1", "Season 1 Streaming Now",
    //   "Season 1 Episode 4", and "Season 1 Episode 4: <Episode Name>"
    /Season \d+.*$/i,
    ...languages.map((l) => `${l} Movie`),
    ...languages.map((l) => `(${l} Dub)`),
    ...languages.map((l) => `(${l})`),
    "(Dub)",
    "(Dubs)",
    /\sS\d+$/, // suffixes like "S09"; see https://github.com/ackinc/webext-movie-ratings/issues/1
    /\(\d{4}\)/, // year
    // REVIEW: are there many programs whose titles legitimately
    //   end with these words?
    /Movie|Series$/,
    /: Restored Version$/i,
    /\(Extended Version\)$/i,
    /\(Extended Edition\)$/i,
    /- Extended Edition$/i,
  ];
  toRemove.forEach((x) => (title = title.replace(x, "")));
  return (
    title
      .trim()
      .replace(/\s+/, " ")
      // title should end with alphabet or number
      .replace(/[^A-Za-z0-9]*$/, "")
  );
}

export async function getSetting<K extends keyof ExtensionSettings>(
  key: K,
): Promise<ExtensionSettings[K] | undefined> {
  return await storage.get(key);
}

export async function setSetting<K extends keyof ExtensionSettings>(
  key: K,
  value: ExtensionSettings[K],
): Promise<void> {
  await storage.set(key, value);
}
