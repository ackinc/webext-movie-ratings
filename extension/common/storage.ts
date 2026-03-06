import { browser } from "./constants";

export async function get<T>(key: string): Promise<T | undefined> {
  const result = await browser.storage.local.get([key]);
  return result[key] as T | undefined;
}

export async function getAll(): Promise<Record<string, unknown>> {
  return await browser.storage.local.get();
}

export async function set<T>(key: string, value: T): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

export async function remove(keys: string[]): Promise<void> {
  await browser.storage.local.remove(keys);
}
