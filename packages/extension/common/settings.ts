import * as storage from "./storage";
import { type ExtensionSettings } from "./types";

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
