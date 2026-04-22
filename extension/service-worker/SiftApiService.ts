import type { ProgramData } from "../common/types";
import { pick } from "../../utils";
import { hostToSitename } from "common";

// TODO: this is a duplicate definition (also defined in api-server); find
//   a way to dedupe
type MatchResult =
  | { status: "pending" }
  | { status: "abandoned" }
  | { status: "matched"; imdbId: string };

export async function getMatchedImdbId(
  programData: ProgramData,
  requestingPageUrl: string,
) {
  const url = new URL(`${SIFT_API_URL}/imdbId`);
  url.search = new URLSearchParams(
    // ensure we don't send unnecessary search params
    {
      ...pick(programData, ["title", "type", "year"]),
      website: hostToSitename[new URL(requestingPageUrl).hostname]!,
    },
  ).toString();

  const response = await fetch(url);
  if (!response.ok) {
    /* TODO: do something */
  }

  return (await response.json()) as MatchResult;
}
