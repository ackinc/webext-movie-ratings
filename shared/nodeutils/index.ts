import * as fs from "node:fs";
import { pipeline } from "node:stream/promises";
import type { Stream } from "node:stream";

export function isError(e: unknown): e is NodeJS.ErrnoException {
  return e instanceof Error;
}

export async function downloadFile(
  url: string,
  outputPath: string,
  ...transforms: Stream.Transform[]
) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download: ${response.status} ${response.statusText}`,
    );
  }
  if (!response.body) throw new Error(`Unexpected empty response body`);

  await pipeline(
    response.body,
    ...transforms,
    fs.createWriteStream(outputPath),
  );
}
