import { browser } from "./constants";

export async function get<T>(key: string): Promise<T | undefined> {
  const result = await browser.storage.local.get([key]);
  return result[key] as T | undefined;
}

export async function set(key: string, value: unknown): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}
