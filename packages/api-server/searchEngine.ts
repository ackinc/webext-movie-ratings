import { parseISO } from "date-fns";
import { Meilisearch } from "meilisearch";
import type { IndexedImdbTitle, Program } from "./types.ts";

const { MEILISEARCH_MASTER_KEY, MEILISEARCH_URL } = process.env;

const client = new Meilisearch({
  host: MEILISEARCH_URL!,
  apiKey: MEILISEARCH_MASTER_KEY!,
});
const index = client.index("imdb");

const defaultThreshold = 0.9;
const defaultLimit = 5;

export async function querySearchEngine(
  program: Omit<Program, "pageUrl">,
  rankingScoreThreshold: number = defaultThreshold,
  limit: number = defaultLimit,
): Promise<IndexedImdbTitle[]> {
  let { hits: searchResults } = await index.search<IndexedImdbTitle>(
    program.title,
    { limit, rankingScoreThreshold },
  );
  searchResults = searchResults.filter(
    ({ type, year }) =>
      (type === program.type || program.type === undefined) &&
      (year === program.year || program.year === undefined),
  );
  return searchResults;
}

export async function getIndexLastUpdatedTime(): Promise<Date> {
  const info = await index.getRawInfo();
  return parseISO(info.updatedAt);
}
