import { type IDBPDatabase } from "idb";
import { add } from "date-fns";
import {
  ErrorMessage,
  omit,
  programToHash,
  type CachedIMDBData,
  type IMDBData,
  type ProgramData,
} from "@common";
import RatingsCache, { type RatingsCacheSchema } from "@common/RatingsCache";
import TelemetryStore, {
  type TelemetryStoreSchema,
} from "@common/TelemetryStore";
import * as siftApiService from "@common/siftApiService";
import OmdbApiClient from "./OmdbApiClient";

let inProgress: Record<
  string,
  { resolve: (x: Required<IMDBData>) => void; reject: (e: Error) => void }[]
>;
let omdbApiClient: OmdbApiClient;
let ratingsCache: RatingsCache;
let telemetryStore: TelemetryStore;

const ratingCacheDurations = {
  onProgramMatchingError: { minutes: -1 },
  onRatingNotFound: { weeks: 1 },
  onRatingFound: { weeks: 2 },
};

export async function initialize(db: IDBPDatabase) {
  inProgress = {};
  omdbApiClient = new OmdbApiClient(fetchWithAddedTelemetry);
  ratingsCache = await RatingsCache.create(
    db as IDBPDatabase<RatingsCacheSchema>,
  );
  if (FF_TELEMETRY_ENABLED) {
    telemetryStore = await TelemetryStore.create(
      db as IDBPDatabase<TelemetryStoreSchema>,
    );
  }
}

async function fetchWithAddedTelemetry(
  ...args: Parameters<typeof fetch>
): ReturnType<typeof fetch> {
  const startTime = +new Date();

  if (FF_TELEMETRY_ENABLED) {
    await telemetryStore.logEvent({
      type: "RATINGS_API_REQUEST_MADE",
      data: { startTime },
    });
  }

  const response = await fetch(...args);
  if (FF_TELEMETRY_ENABLED) {
    await telemetryStore.logEvent({
      type: "RATINGS_API_RESPONSE_RECEIVED",
      data: {
        startTime,
        durationMs: +new Date() - startTime,
      },
    });
  }

  return response;
}

export async function getIMDBData(
  program: ProgramData,
  pageUrl: string,
): Promise<Required<IMDBData>> {
  const cached = await getCachedIMDBData(program);
  if (cached && cached.expiry > +new Date()) {
    return omit(cached, ["key"] as const);
  }

  return new Promise<Required<IMDBData>>((resolve, reject) => {
    const key = programToHash(program);
    if (key in inProgress) {
      inProgress[key]!.push({ resolve, reject });
    } else {
      inProgress[key] = [{ resolve, reject }];
      helper(key);
    }
  });

  async function helper(key: string) {
    let imdbData: IMDBData | null = null;
    let error: Error | null = null;

    try {
      const skipOmdbSearchQuery = cached?.imdbRating === "N/M";
      if (!skipOmdbSearchQuery) {
        // the cached imdbId may be '' (from a cached N/F rating), so we
        //   cannot use '??' operator below
        imdbData = await omdbApiClient.fetchIMDBData(cached?.imdbId || program);
      } else {
        // if we're here, it means the last time this function was called for
        //   this program, there was:
        //   a) an N/F response from omdb api
        //   b) a (temporary) error from the sift program-matching api
        // we skipped the omdb api search request above because
        //   because we'll just get an N/F again
      }

      if (!cached?.imdbId && !imdbData?.imdbId) {
        // we didn't have the program's imdb id, and the omdb api wasn't
        //   able to figure it out based on the program's details; let's see
        //   if sift's program-matching can do it
        const { imdbId: matchedImdbId } = await siftApiService
          .getMatchedImdbId(program, pageUrl)
          .catch(() => (imdbData = { imdbId: "", imdbRating: "N/M" }));

        if (matchedImdbId) {
          // try to get the imdb data from omdb by querying with the
          //   imdb id we just matched this program to
          imdbData = await omdbApiClient.fetchIMDBData(matchedImdbId);
        }
      }
    } catch (e) {
      error =
        e instanceof Error
          ? e
          : new Error("Error fetching imdb data", { cause: e });
    } finally {
      if (error) {
        inProgress[key]!.forEach(({ reject }) => reject(error!));
        delete inProgress[key];
      } else {
        const expiry = +add(
          new Date(),
          imdbData!.imdbRating === "N/M"
            ? ratingCacheDurations.onProgramMatchingError
            : imdbData!.imdbRating === "N/F"
              ? ratingCacheDurations.onRatingNotFound
              : ratingCacheDurations.onRatingFound,
        );
        inProgress[key]!.forEach(({ resolve }) =>
          resolve({ ...imdbData!, expiry }),
        );
        delete inProgress[key];

        await ratingsCache.putOne({ ...imdbData!, expiry, key });
      }
    }
  }
}

export async function getCachedIMDBData(
  program: ProgramData,
): Promise<CachedIMDBData | undefined> {
  if (!ratingsCache) throw new Error(ErrorMessage.ratingsServiceNotInitialized);
  return await ratingsCache.get(programToHash(program));
}
