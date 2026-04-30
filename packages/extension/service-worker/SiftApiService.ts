import type { ProgramData } from "../common/types";
import { pick } from "siftutils";

// TODO: this is a duplicate definition (also defined in api-server); find
//   a way to dedupe
type MatchResult =
  | { status: "pending" }
  | { status: "abandoned" }
  | { status: "matched"; imdbId: string };

export async function getMatchedImdbId(
  programData: ProgramData,
  pageUrl: string,
) {
  const url = new URL(`${SIFT_API_URL}/imdbId`);
  // TODO: add type-checking here (relevant type def is in api-server)
  url.search = new URLSearchParams({
    // ensure we don't send unnecessary search params
    ...pick(programData, ["title", "type", "year"]),
    pageUrl,
  }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    /* TODO: do something */
  }

  return (await response.json()) as MatchResult;
}
