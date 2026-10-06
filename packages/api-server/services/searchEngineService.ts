import { parseISO, differenceInMinutes } from "date-fns";
import { Meilisearch } from "meilisearch";
import type { IndexedImdbTitle } from "siftcore";
import type { ProgramMatchQuery } from "../types.ts";

const { MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } = process.env;

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = client.index("imdb");

const defaultThreshold = 0.9;
const defaultLimit = 5;

export async function querySearchEngine(
  query: Omit<ProgramMatchQuery, "site">,
  limit: number = defaultLimit,
  rankingScoreThreshold: number = defaultThreshold,
): Promise<IndexedImdbTitle[]> {
  const { hits: searchResults } = await index.search<IndexedImdbTitle>(
    query.title,
    { limit, rankingScoreThreshold, distinct: "imdbId" },
  );

  if (searchResults.length === 0) return [];

  // The streaming websites sometimes get program details wrong
  // Example: YT movies lists the release year of "The Shawshank Redemption"
  //   as 1995, when it is actually 1994
  // For this reason, if we don't get matches when applying the type
  //   and year constraints, we'll relax them

  const searchResultsWithTypeAndYearMatch = searchResults.filter(
    ({ type, year }) =>
      (type === query.type || !query.type) &&
      (year === query.year || !query.year),
  );
  if (searchResultsWithTypeAndYearMatch.length > 0)
    return searchResultsWithTypeAndYearMatch;

  const searchResultsWithTypeMatch = searchResults.filter(
    ({ type }) => type === query.type || !query.type,
  );
  if (searchResultsWithTypeMatch.length > 0) return searchResultsWithTypeMatch;

  return searchResults;
}

// small hack to reduce the amount of IPC between the api-server and
//   the search engine
let cachedIndexLastUpdatedTime: Date | null = null;
export async function getIndexLastUpdatedTime(): Promise<Date> {
  if (
    cachedIndexLastUpdatedTime === null ||
    differenceInMinutes(new Date(), cachedIndexLastUpdatedTime) >= 1
  ) {
    const info = await index.getRawInfo();
    cachedIndexLastUpdatedTime = parseISO(info.updatedAt);
  }

  return cachedIndexLastUpdatedTime;
}
