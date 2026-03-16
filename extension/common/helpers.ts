// this module is for more complex helper fns

import { openDB } from "idb";
import { browser, languages, DB_NAME, DB_VERSION } from "./constants";
import type { ExtensionContext, ExtensionSettings, Message } from "./types";
import TelemetryStore from "./TelemetryStore";
import RatingsCache from "./RatingsCache";
import { captureException } from "./errorReporter";
import * as storage from "./storage";

export function getExtensionContext(): ExtensionContext {
  const { location } = globalThis;

  if (location.protocol.startsWith("http")) return "content-script";

  if (location.pathname.includes("popup")) return "popup";

  if (location.pathname.includes("service-worker")) return "service-worker";

  // chrome-extension in chrome & edge; moz-extension in firefox
  if (location.protocol.endsWith("extension")) return "extension-page";

  throw new Error(`Could not figure out context. Running at ${location.href}`);
}

export async function sendMessageToAllTabs(message: Message) {
  // can't rely on manifest since all host perms are now optional
  const perms = (await browser.permissions.getAll()).origins ?? [];
  if (perms.length === 0) {
    // calling tabs.query with url set to an empty arr returns all tabs,
    //   which is not what we want
    return [];
  }

  const tabs = await browser.tabs.query({ url: perms });
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
      context: { tab: { id: tab.id, url: tab.url }, message },
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

export async function upgradeIdbAndGetConnection() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade: (db, oldVersion) => {
      RatingsCache.upgradeDb(db, oldVersion);
      TelemetryStore.upgradeDb(db, oldVersion);
    },
  });
  await setSetting("updatedDbVersion", DB_VERSION);
  return db;
}
