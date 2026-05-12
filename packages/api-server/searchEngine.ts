import { parseISO } from "date-fns";
import { Meilisearch } from "meilisearch";
import type { SiftApiProgramMatching } from "sifttypes";
import type { IndexedImdbTitle } from "./types.ts";

const { MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } = process.env;

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = client.index("imdb");

const defaultThreshold = 0.9;
const defaultLimit = 5;

export async function querySearchEngine(
  program: Omit<SiftApiProgramMatching.Request, "pageUrl">,
  rankingScoreThreshold: number = defaultThreshold,
  limit: number = defaultLimit,
): Promise<IndexedImdbTitle[]> {
  const { hits: searchResults } = await index.search<IndexedImdbTitle>(
    program.title,
    { limit, rankingScoreThreshold },
  );

  if (searchResults.length === 0) return [];

  // The streaming websites sometimes get program details wrong
  // Example: YT movies lists the release year of "The Shawshank Redemption"
  //   as 1995, when it is actually 1994
  // For this reason, if we don't get matches when applying the type
  //   and year constraints, we'll relax them

  const searchResultsWithTypeAndYearMatch = searchResults.filter(
    ({ type, year }) =>
      (type === program.type || program.type === undefined) &&
      (year === program.year || program.year === undefined),
  );
  if (searchResultsWithTypeAndYearMatch.length > 0)
    return searchResultsWithTypeAndYearMatch;

  const searchResultsWithTypeMatch = searchResults.filter(
    ({ type }) => type === program.type || program.type === undefined,
  );
  if (searchResultsWithTypeMatch.length > 0) return searchResultsWithTypeMatch;

  return searchResults;
}

export async function getIndexLastUpdatedTime(): Promise<Date> {
  const info = await index.getRawInfo();
  return parseISO(info.updatedAt);
}
