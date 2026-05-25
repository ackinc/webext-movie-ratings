import type { ProgramData } from "./types";
import { pick } from "siftutils";
import type { SiftApiProgramMatching, UserMessage } from "sifttypes";
import { ErrorMessage } from ".";

export async function getMatchedImdbId(
  programData: ProgramData,
  pageUrl: string,
): Promise<SiftApiProgramMatching.Response> {
  const url = new URL(`${SIFT_API_URL}/imdbId`);

  const searchParams = {
    ...pick(programData, ["title", "type", "year"]),
    pageUrl,
  } satisfies SiftApiProgramMatching.Request;
  url.search = new URLSearchParams(
    // bit of harmless type coercion to avoid a type error; the
    //   URLSearchParams constructor will convert the numeric 'year'
    //   into a string automatically
    searchParams as unknown as Record<string, string>,
  ).toString();

  const response = await fetch(url);
  if (!response.ok) throw new Error(ErrorMessage.siftApiServerError);
  return (await response.json()) as SiftApiProgramMatching.Response;
}

export async function sendUserFeedback(message: string, email: string) {
  const url = new URL(`${SIFT_API_URL}/messages`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: "feedback",
      message,
      ...(email ? { email } : {}),
    } satisfies UserMessage),
  });
  if (!response.ok) throw new Error(ErrorMessage.siftApiServerError);
}
