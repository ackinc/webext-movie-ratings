import { browser } from "./constants";

export async function get(key: string): Promise<unknown> {
  const result = await browser.storage.local.get([key]);
  return result[key];
}

export async function set(key: string, value: unknown): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}
