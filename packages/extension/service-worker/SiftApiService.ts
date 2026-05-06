import type { ProgramData } from "../common/types";
import { pick } from "siftutils";
import type { SiftApiProgramMatching } from "sifttypes";

type MatchResult = { error: "string" } | SiftApiProgramMatching.Response;

export async function getMatchedImdbId(
  programData: ProgramData,
  pageUrl: string,
): Promise<MatchResult> {
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
  return (await response.json()) as MatchResult;
}
